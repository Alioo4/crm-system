import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class UploadService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = this.config.getOrThrow<string>('R2_PUBLIC_URL').replace(/\/$/, '');

    this.client = new S3Client({
      region: 'auto',
      endpoint: this.config.getOrThrow<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    this.validateFile(file);

    const ext = path.extname(file.originalname).toLowerCase();
    const key = `images/${randomUUID()}${ext}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.size,
        }),
      );
    } catch (err) {
      throw new InternalServerErrorException(`R2 upload failed: ${(err as Error).message}`);
    }

    return { url: `${this.publicUrl}/${key}`, key };
  }

  async uploadImages(files: Express.Multer.File[]): Promise<{ url: string; key: string }[]> {
    return Promise.all(files.map((file) => this.uploadImage(file)));
  }

  async deleteImage(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      throw new InternalServerErrorException(`R2 delete failed: ${(err as Error).message}`);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed: jpeg, png, webp, gif, svg`,
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File too large. Max size is 10 MB`);
    }
  }
}
