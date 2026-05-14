import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequireVerified } from '../auth/decorators/verified.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { StorageService, UploadResult } from './storage.service';

const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIMES = StorageService.allowedMimes().join('|');
const MIME_REGEX = new RegExp(`^(${ALLOWED_MIMES})$`);

@Controller('media')
export class MediaController {
  private readonly maxBytes: number;

  constructor(
    private readonly storage: StorageService,
    config: ConfigService,
  ) {
    const raw = Number(config.get<string>('MAX_UPLOAD_BYTES'));
    this.maxBytes = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_BYTES;
  }

  @UseGuards(EmailVerifiedGuard)
  @RequireVerified()
  @Post('images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: MIME_REGEX })
        .addMaxSizeValidator({ maxSize: 8 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    if (file.size > this.maxBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${this.maxBytes} bytes`,
      );
    }
    return this.storage.uploadImage(file.buffer, file.mimetype);
  }
}
