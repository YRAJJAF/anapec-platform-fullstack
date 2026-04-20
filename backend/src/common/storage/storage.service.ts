import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('aws.bucketName', 'anapec-platform');
    this.s3 = new S3Client({
      region: this.config.get<string>('aws.region', 'eu-west-1'),
      credentials: {
        accessKeyId: this.config.get<string>('aws.accessKeyId', 'minioadmin'),
        secretAccessKey: this.config.get<string>('aws.secretAccessKey', 'minioadmin'),
      },
      ...(this.config.get('aws.endpoint')
        ? {
            endpoint: this.config.get<string>('aws.endpoint'),
            forcePathStyle: true,
          }
        : {}),
    });
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const endpoint = this.config.get<string>('aws.endpoint');
    if (endpoint) {
      return `${endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.config.get('aws.region')}.amazonaws.com/${key}`;
  }

  async downloadFile(urlOrKey: string): Promise<Buffer> {
    // Extract key from URL if full URL passed
    const key = urlOrKey.includes('/') ? urlOrKey.split(`${this.bucket}/`).pop()! : urlOrKey;

    const response = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  buildKey(...parts: string[]): string {
    return parts.filter(Boolean).join('/').replace(/\/+/g, '/');
  }
}
