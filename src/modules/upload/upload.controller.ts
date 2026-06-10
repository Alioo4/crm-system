import {
  Controller,
  Post,
  Delete,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOperation({ summary: 'Upload single image to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({
    schema: {
      example: {
        url: 'https://pub-xxx.r2.dev/images/uuid.jpg',
        key: 'images/uuid.jpg',
      },
    },
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadImage(file);
  }

  @Post('images')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  @ApiOperation({ summary: 'Upload multiple images (max 10) to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOkResponse({
    schema: {
      example: [
        { url: 'https://pub-xxx.r2.dev/images/uuid1.jpg', key: 'images/uuid1.jpg' },
        { url: 'https://pub-xxx.r2.dev/images/uuid2.png', key: 'images/uuid2.png' },
      ],
    },
  })
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadImages(files);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete image from Cloudflare R2 by key' })
  @ApiQuery({ name: 'key', example: 'images/uuid.jpg', description: 'R2 object key' })
  @ApiOkResponse({ schema: { example: { message: 'Deleted successfully' } } })
  async deleteImage(@Query('key') key: string) {
    if (!key) throw new BadRequestException('key query param is required');
    await this.uploadService.deleteImage(key);
    return { message: 'Deleted successfully' };
  }
}
