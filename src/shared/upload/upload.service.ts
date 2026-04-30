import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

export interface UploadedFileInfo {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadDir =
      this.configService.get<string>('upload.dir') || './uploads';
    this.baseUrl =
      this.configService.get<string>('app.baseUrl') || 'http://localhost:3000';
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory created: ${this.uploadDir}`);
    }
  }

  private buildFileInfo(file: Express.Multer.File): UploadedFileInfo {
    const relativePath = path.relative(process.cwd(), file.path);
    return {
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `${this.baseUrl}/uploads/${file.filename}`,
      path: relativePath,
    };
  }

  uploadSingle(file: Express.Multer.File | undefined): UploadedFileInfo {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    this.logger.log(`File uploaded: ${file.originalname} (${file.size} bytes)`);
    return this.buildFileInfo(file);
  }

  uploadMultiple(files: Express.Multer.File[] | undefined): UploadedFileInfo[] {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    this.logger.log(`${files.length} file(s) uploaded`);
    return files.map((f) => this.buildFileInfo(f));
  }

  deleteFile(fileName: string): { message: string } {
    const filePath = path.join(this.uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      this.logger.log(`File deleted: ${fileName}`);
      return { message: 'File deleted successfully' };
    }
    throw new BadRequestException(`File not found: ${fileName}`);
  }

  getFileUrl(fileName: string): string {
    return `${this.baseUrl}/uploads/${fileName}`;
  }
}
