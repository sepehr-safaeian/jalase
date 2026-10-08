import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { User } from '../auth/entities/user.entity.js';
import type { MeetingExtractionKind } from '@jalase/shared';
import { MEETING_EXTRACTION_ORDER } from '@jalase/shared';
import { MeetingExtractionService } from './meeting-extraction.service.js';
import { NotesService } from './notes.service.js';
import {
  AddNoteMemberDto,
  CreateNoteDto,
  UpdateNoteDto,
  UpdateSpeakerMappingsDto,
} from './dto/note.dto.js';
import { SearchNotesQueryDto } from './dto/search-notes.dto.js';
import { ListMeetingsQueryDto } from './dto/list-meetings.dto.js';

@ApiTags('notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly meetingExtractionService: MeetingExtractionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'لیست یادداشت‌ها' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  list(
    @Req() req: Request & { user: User },
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.notesService.list(
      req.user.id,
      includeArchived === 'true',
    );
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد یادداشت' })
  create(@Req() req: Request & { user: User }, @Body() dto: CreateNoteDto) {
    return this.notesService.create(req.user.id, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'جستجوی کلیدواژه در یادداشت‌ها' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'scope', required: false, enum: ['recent', 'older'] })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(@Req() req: Request & { user: User }, @Query() dto: SearchNotesQueryDto) {
    return this.notesService.search(req.user.id, dto);
  }

  @Get('meetings')
  @ApiOperation({ summary: 'لیست جلسات بر اساس باکت زمانی' })
  @ApiQuery({ name: 'bucket', required: true, enum: ['today', 'tomorrow', 'next_week', 'past'] })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tzOffsetMinutes', required: false, type: Number })
  listMeetings(
    @Req() req: Request & { user: User },
    @Query() dto: ListMeetingsQueryDto,
  ) {
    return this.notesService.listMeetings(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یادداشت' })
  getOne(@Req() req: Request & { user: User }, @Param('id') id: string) {
    return this.notesService.getById(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش یادداشت' })
  update(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف نرم یادداشت' })
  async remove(@Req() req: Request & { user: User }, @Param('id') id: string) {
    await this.notesService.remove(req.user.id, id);
    return { ok: true };
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'آرشیو یادداشت' })
  archive(@Req() req: Request & { user: User }, @Param('id') id: string) {
    return this.notesService.archive(req.user.id, id);
  }

  @Post(':id/unarchive')
  @ApiOperation({ summary: 'بازگردانی یادداشت از آرشیو' })
  unarchive(@Req() req: Request & { user: User }, @Param('id') id: string) {
    return this.notesService.unarchive(req.user.id, id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'افزودن عضو به یادداشت' })
  addMember(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
    @Body() dto: AddNoteMemberDto,
  ) {
    return this.notesService.addMember(req.user.id, id, dto);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'حذف عضو از یادداشت' })
  removeMember(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.notesService.removeMember(req.user.id, id, memberId);
  }

  @Patch(':id/speaker-mappings')
  @ApiOperation({ summary: 'نام‌گذاری گوینندگان رونوشت' })
  updateSpeakerMappings(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
    @Body() dto: UpdateSpeakerMappingsDto,
  ) {
    return this.notesService.updateSpeakerMappings(req.user.id, id, dto);
  }

  @Post(':id/extractions/:kind')
  @ApiOperation({ summary: 'استخراج هوشمند بخشی از جلسه (یک‌بار مصرف)' })
  extractMeetingInsight(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
    @Param('kind') kind: string,
  ) {
    if (!MEETING_EXTRACTION_ORDER.includes(kind as MeetingExtractionKind)) {
      throw new BadRequestException('نوع استخراج نامعتبر است');
    }
    return this.meetingExtractionService.extract(
      req.user.id,
      id,
      kind as MeetingExtractionKind,
    );
  }
}
