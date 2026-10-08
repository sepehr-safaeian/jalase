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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { User } from '../auth/entities/user.entity.js';
import { NotesService } from '../notes/notes.service.js';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto.js';
import {
  ListProjectMeetingsQueryDto,
  resolveProjectMeetingsLimit,
} from './dto/list-project-meetings.dto.js';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly notesService: NotesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'لیست پروژه‌ها' })
  @ApiQuery({ name: 'includeArchived', required: false, type: Boolean })
  list(
    @Req() req: Request & { user: User },
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.projectsService.list(
      req.user.id,
      includeArchived === 'true',
    );
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد پروژه' })
  create(
    @Req() req: Request & { user: User },
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(req.user.id, dto);
  }

  @Get(':id/meetings')
  @ApiOperation({ summary: 'لیست جلسات یک پروژه' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listMeetings(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
    @Query() dto: ListProjectMeetingsQueryDto,
  ) {
    return this.notesService.listProjectMeetings(req.user.id, id, {
      cursor: dto.cursor,
      limit: resolveProjectMeetingsLimit(dto.limit),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات پروژه' })
  getOne(@Req() req: Request & { user: User }, @Param('id') id: string) {
    return this.projectsService.getById(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش پروژه' })
  update(
    @Req() req: Request & { user: User },
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.user.id, id, dto);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'آرشیو پروژه' })
  archive(@Req() req: Request & { user: User }, @Param('id') id: string) {
    return this.projectsService.archive(req.user.id, id);
  }

  @Post(':id/unarchive')
  @ApiOperation({ summary: 'بازگردانی پروژه از آرشیو' })
  unarchive(@Req() req: Request & { user: User }, @Param('id') id: string) {
    return this.projectsService.unarchive(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف پروژه' })
  async remove(@Req() req: Request & { user: User }, @Param('id') id: string) {
    await this.projectsService.remove(req.user.id, id);
    return { ok: true };
  }
}
