import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

export interface UploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
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

  private readonly bucket: string | undefined;
  private readonly publicUrl: string | undefined;
  private readonly accountId: string | undefined;
  private readonly accessKeyId: string | undefined;
  private readonly secretAccessKey: string | undefined;

  constructor(config: ConfigService) {
    this.accountId = config.get<string>('R2_ACCOUNT_ID') || undefined;
    this.accessKeyId = config.get<string>('R2_ACCESS_KEY_ID') || undefined;
    this.secretAccessKey =
      config.get<string>('R2_SECRET_ACCESS_KEY') || undefined;
    this.bucket = config.get<string>('R2_BUCKET') || undefined;
    this.publicUrl =
      config.get<string>('R2_PUBLIC_URL')?.replace(/\/$/, '') || undefined;
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
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Image uploads are disabled — Cloudflare R2 is not configured.',
      );
    }
    const ext = MIME_TO_EXT[mimeType];
    if (!ext) {
      throw new InternalServerErrorException(
        `Unsupported mime type: ${mimeType}`,
      );
    }
    const key = buildKey(prefix, ext);
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
