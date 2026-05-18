import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';

export interface UploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
  storage: 'r2' | 'local';
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;

  // R2
  private readonly bucket: string | undefined;
  private readonly publicUrl: string | undefined;
  private readonly accountId: string | undefined;
  private readonly accessKeyId: string | undefined;
  private readonly secretAccessKey: string | undefined;

  // Local fallback
  private readonly localRoot = process.cwd();
  private readonly localBaseUrl: string;

  constructor(config: ConfigService) {
    this.accountId = config.get<string>('R2_ACCOUNT_ID') || undefined;
    this.accessKeyId = config.get<string>('R2_ACCESS_KEY_ID') || undefined;
    this.secretAccessKey =
      config.get<string>('R2_SECRET_ACCESS_KEY') || undefined;
    this.bucket = config.get<string>('R2_BUCKET') || undefined;
    this.publicUrl =
      config.get<string>('R2_PUBLIC_URL')?.replace(/\/$/, '') || undefined;
    this.localBaseUrl = (
      config.get<string>('APP_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  isConfigured(): boolean {
    return Boolean(
      this.accountId &&
        this.accessKeyId &&
        this.secretAccessKey &&
        this.bucket &&
        this.publicUrl,
    );
  }

  static allowedMimes(): string[] {
    return Object.keys(MIME_TO_EXT);
  }

  async uploadImage(
    buffer: Buffer,
    mimeType: string,
    prefix = 'images',
  ): Promise<UploadResult> {
    const ext = MIME_TO_EXT[mimeType];
    if (!ext) {
      throw new InternalServerErrorException(
        `Unsupported mime type: ${mimeType}`,
      );
    }
    const key = buildKey(prefix, ext);

    if (this.isConfigured()) {
      return this.uploadToR2(buffer, key, mimeType);
    }
    return this.uploadToLocal(buffer, key, mimeType);
  }

  private async uploadToR2(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<UploadResult> {
    const client = this.getClient();
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (err) {
      this.logger.error(`R2 upload failed for ${key}`, err as Error);
      throw new InternalServerErrorException('Failed to store image');
    }
    return {
      key,
      url: `${this.publicUrl}/${key}`,
      contentType: mimeType,
      size: buffer.byteLength,
      storage: 'r2',
    };
  }

  private async uploadToLocal(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<UploadResult> {
    const fullPath = join(this.localRoot, key);
    try {
      await fs.mkdir(dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, buffer);
    } catch (err) {
      this.logger.error(`Local image write failed for ${fullPath}`, err as Error);
      throw new InternalServerErrorException('Failed to store image');
    }
    return {
      key,
      url: `${this.localBaseUrl}/${key}`,
      contentType: mimeType,
      size: buffer.byteLength,
      storage: 'local',
    };
  }

  private getClient(): S3Client {
    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.accessKeyId!,
          secretAccessKey: this.secretAccessKey!,
        },
      });
    }
    return this.client;
  }
}

function buildKey(prefix: string, ext: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const rand = randomBytes(16).toString('hex');
  return `${prefix}/${yyyy}/${mm}/${rand}.${ext}`;
}
