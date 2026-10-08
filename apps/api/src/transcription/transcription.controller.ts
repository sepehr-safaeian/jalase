import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { User } from '../auth/entities/user.entity.js';
import { TranscriptionChunkDto } from './dto/transcription.dto.js';
import { TranscriptionService } from './transcription.service.js';

const MAX_CHUNK_BYTES = 25 * 1024 * 1024;
const MAX_FINALIZE_BYTES = 100 * 1024 * 1024;

@ApiTags('transcription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes/:noteId/recording')
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Get('status')
  @ApiOperation({ summary: 'وضعیت ضبط و رونویسی' })
  status(@Req() req: Request & { user: User }, @Param('noteId') noteId: string) {
    return this.transcriptionService.getStatus(req.user.id, noteId);
  }

  @Post('start')
  @ApiOperation({ summary: 'شروع ضبط جلسه' })
  start(@Req() req: Request & { user: User }, @Param('noteId') noteId: string) {
    return this.transcriptionService.start(req.user.id, noteId);
  }

  @Post('stop')
  @ApiOperation({ summary: 'لغو ضبط بدون رونویسی' })
  stop(@Req() req: Request & { user: User }, @Param('noteId') noteId: string) {
    return this.transcriptionService.stop(req.user.id, noteId);
  }

  @Post('finalize')
  @ApiOperation({ summary: 'پایان ضبط و رونویسی کامل جلسه' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: { type: 'string', format: 'binary' },
      },
      required: ['audio'],
    },
  })
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FINALIZE_BYTES },
    }),
  )
  finalize(
    @Req() req: Request & { user: User },
    @Param('noteId') noteId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('فایل صوتی دریافت نشد');
    }

    return this.transcriptionService.finalizeRecording(
      req.user.id,
      noteId,
      file.buffer,
      file.mimetype,
    );
  }

  @Post('chunk')
  @ApiOperation({ summary: 'ارسال بخش صوتی (legacy، بدون رونویسی زنده)' })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: { type: 'string', format: 'binary' },
        chunkIndex: { type: 'integer' },
        durationMs: { type: 'integer' },
      },
      required: ['audio', 'chunkIndex'],
    },
  })
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_CHUNK_BYTES },
    }),
  )
  chunk(
    @Req() req: Request & { user: User },
    @Param('noteId') noteId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: TranscriptionChunkDto,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('فایل صوتی دریافت نشد');
    }

    return this.transcriptionService.processChunk(
      req.user.id,
      noteId,
      dto.chunkIndex,
      file.buffer,
      file.mimetype,
      dto.durationMs,
      dto.clientSilent,
    );
  }
}
