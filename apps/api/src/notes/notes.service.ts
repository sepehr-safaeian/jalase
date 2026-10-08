import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type {
  MeetingBucket,
  MeetingListResponse,
  NoteDetail,
  NoteMember as NoteMemberDto,
  NoteSearchHit,
  NoteSearchResponse,
  NoteSummary,
  ProjectMeetingsResponse,
} from '@jalase/shared';
import {
  NOTE_SEARCH_DEFAULT_LIMIT,
  NOTE_SEARCH_RECENT_DAYS,
  applySpeakerMappingsToTurns,
  buildSpeakerProfiles,
  decodeMeetingListCursor,
  decodeNoteSearchCursor,
  encodeMeetingListCursor,
  encodeNoteSearchCursor,
  escapeIlikePattern,
  getMeetingBucketRange,
  normalizeSearchQuery,
  parseSpeakerNameMappings,
  parseTranscriptDocument,
  parseMeetingAiExtractions,
  resolveSearchMatch,
  sanitizeSpeakerName,
  serializeSpeakerNameMappings,
  syncTranscriptSection,
  turnsToFlatTranscript,
  TEHRAN_TZ_OFFSET_MINUTES,
} from '@jalase/shared';
import { Project } from '../projects/entities/project.entity.js';
import { Note } from './entities/note.entity.js';
import { NoteMember } from './entities/note-member.entity.js';
import {
  AddNoteMemberDto,
  CreateNoteDto,
  UpdateNoteDto,
  UpdateSpeakerMappingsDto,
} from './dto/note.dto.js';
import { SearchNotesQueryDto } from './dto/search-notes.dto.js';
import {
  ListMeetingsQueryDto,
  resolveMeetingListLimit,
} from './dto/list-meetings.dto.js';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepo: Repository<Note>,
    @InjectRepository(NoteMember)
    private readonly membersRepo: Repository<NoteMember>,
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
  ) {}

  async list(userId: string, includeArchived = false): Promise<NoteSummary[]> {
    const notes = await this.notesRepo.find({
      where: {
        userId,
        deletedAt: IsNull(),
        ...(includeArchived ? {} : { archivedAt: IsNull() }),
      },
      relations: { project: true, members: true },
      order: { updatedAt: 'DESC' },
    });
    return notes.map((note) => this.toSummary(note));
  }

  async listMeetings(
    userId: string,
    dto: ListMeetingsQueryDto,
  ): Promise<MeetingListResponse> {
    const bucket = dto.bucket;
    const tzOffsetMinutes = dto.tzOffsetMinutes ?? TEHRAN_TZ_OFFSET_MINUTES;
    const limit = resolveMeetingListLimit(bucket, dto.limit);
    const range = getMeetingBucketRange(bucket, new Date(), tzOffsetMinutes);

    const qb = this.notesRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.project', 'project')
      .leftJoinAndSelect('note.members', 'members')
      .where('note.user_id = :userId', { userId })
      .andWhere('note.deleted_at IS NULL')
      .andWhere('note.archived_at IS NULL')
      .andWhere('note.meeting_date IS NOT NULL');

    if (bucket === 'past') {
      qb.andWhere('note.meeting_date < :rangeEnd', { rangeEnd: range.end })
        .orderBy('note.meeting_date', 'DESC')
        .addOrderBy('note.id', 'DESC');

      if (dto.cursor) {
        const decoded = decodeMeetingListCursor(dto.cursor);
        if (!decoded) {
          throw new BadRequestException('cursor نامعتبر است');
        }
        qb.andWhere(
          `(note.meeting_date < :cursorDate OR (note.meeting_date = :cursorDate AND note.id < :cursorId))`,
          {
            cursorDate: new Date(decoded.meetingDate),
            cursorId: decoded.id,
          },
        );
      }
    } else {
      qb.andWhere('note.meeting_date >= :rangeStart', { rangeStart: range.start })
        .andWhere('note.meeting_date < :rangeEnd', { rangeEnd: range.end })
        .orderBy('note.meeting_date', 'ASC')
        .addOrderBy('note.id', 'ASC');
    }

    qb.take(limit + 1);
    const rows = await qb.getMany();
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const items = page.map((note) => this.toSummary(note));

    let nextCursor: string | null = null;
    if (hasMore && bucket === 'past') {
      const last = page[page.length - 1];
      if (last.meetingDate) {
        nextCursor = encodeMeetingListCursor({
          meetingDate: last.meetingDate.toISOString(),
          id: last.id,
        });
      }
    }

    return {
      items,
      nextCursor,
      bucket,
      hasMore,
    };
  }

  async listProjectMeetings(
    userId: string,
    projectId: string,
    options: { cursor?: string; limit?: number } = {},
  ): Promise<ProjectMeetingsResponse> {
    const project = await this.projectsRepo.findOne({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new NotFoundException('پروژه یافت نشد');
    }

    const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);

    const qb = this.notesRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.project', 'project')
      .leftJoinAndSelect('note.members', 'members')
      .where('note.user_id = :userId', { userId })
      .andWhere('note.project_id = :projectId', { projectId })
      .andWhere('note.deleted_at IS NULL')
      .andWhere('note.archived_at IS NULL')
      .andWhere('note.meeting_date IS NOT NULL')
      .orderBy('note.meeting_date', 'DESC')
      .addOrderBy('note.id', 'DESC');

    if (options.cursor) {
      const decoded = decodeMeetingListCursor(options.cursor);
      if (!decoded) {
        throw new BadRequestException('cursor نامعتبر است');
      }
      qb.andWhere(
        `(note.meeting_date < :cursorDate OR (note.meeting_date = :cursorDate AND note.id < :cursorId))`,
        {
          cursorDate: new Date(decoded.meetingDate),
          cursorId: decoded.id,
        },
      );
    }

    qb.take(limit + 1);
    const rows = await qb.getMany();
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const items = page.map((note) => this.toSummary(note));

    let nextCursor: string | null = null;
    if (hasMore) {
      const last = page[page.length - 1];
      if (last?.meetingDate) {
        nextCursor = encodeMeetingListCursor({
          meetingDate: last.meetingDate.toISOString(),
          id: last.id,
        });
      }
    }

    return {
      projectId,
      items,
      nextCursor,
      hasMore,
    };
  }

  async create(userId: string, dto: CreateNoteDto): Promise<NoteDetail> {
    await this.assertProjectOwned(userId, dto.projectId ?? null);

    const meetingDate = dto.meetingDate
      ? new Date(dto.meetingDate)
      : new Date();

    if (dto.meetingDate) {
      this.assertFutureMeetingDate(meetingDate);
    }

    const saved = await this.notesRepo.save({
      userId,
      title: dto.title?.trim() || 'یادداشت بدون عنوان',
      contentJson: dto.contentJson ?? '',
      contentMarkdown: dto.contentMarkdown ?? '',
      projectId: dto.projectId ?? null,
      meetingDate,
    });

    return this.getById(userId, saved.id);
  }

  async search(userId: string, dto: SearchNotesQueryDto): Promise<NoteSearchResponse> {
    const query = normalizeSearchQuery(dto.q);
    const scope = dto.scope ?? 'recent';
    const limit = dto.limit ?? NOTE_SEARCH_DEFAULT_LIMIT;
    const pattern = `%${escapeIlikePattern(query)}%`;
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - NOTE_SEARCH_RECENT_DAYS);
    const sortExpr = 'COALESCE(note.meeting_date, note.updated_at)';
    const sortAlias = 'note_sort_at';

    const qb = this.notesRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.members', 'members')
      .addSelect(sortExpr, sortAlias)
      .where('note.user_id = :userId', { userId })
      .andWhere('note.deleted_at IS NULL')
      .andWhere('note.archived_at IS NULL')
      .andWhere(
        `(note.title ILIKE :pattern ESCAPE '\\'
          OR note.content_json ILIKE :pattern ESCAPE '\\'
          OR note.content_markdown ILIKE :pattern ESCAPE '\\'
          OR note.transcript_text ILIKE :pattern ESCAPE '\\')`,
        { pattern },
      );

    if (scope === 'recent') {
      qb.andWhere(`${sortExpr} >= :recentCutoff`, { recentCutoff });
    } else {
      qb.andWhere(`${sortExpr} < :recentCutoff`, { recentCutoff });
    }

    if (dto.cursor) {
      const decoded = decodeNoteSearchCursor(dto.cursor);
      if (!decoded) {
        throw new BadRequestException('cursor نامعتبر است');
      }
      qb.andWhere(
        `(${sortExpr} < :cursorSortAt OR (${sortExpr} = :cursorSortAt AND note.id < :cursorId))`,
        {
          cursorSortAt: new Date(decoded.sortAt),
          cursorId: decoded.id,
        },
      );
    }

    qb.orderBy(sortAlias, 'DESC').addOrderBy('note.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);
    const nextCursor =
      hasMore && last
        ? encodeNoteSearchCursor(
            (last.meetingDate ?? last.updatedAt).toISOString(),
            last.id,
          )
        : null;

    return {
      items: page.map((note) => this.toSearchHit(note, query)),
      hasMore,
      nextCursor,
      scope,
      query,
      expandableToOlder: scope === 'recent' && !hasMore,
    };
  }

  async getById(userId: string, id: string): Promise<NoteDetail> {
    const note = await this.findOwned(userId, id);
    return this.toDetail(note);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateNoteDto,
  ): Promise<NoteDetail> {
    const note = await this.findOwned(userId, id);
    await this.assertProjectOwned(userId, dto.projectId ?? note.projectId);

    if (dto.title !== undefined) note.title = dto.title.trim();
    if (dto.contentJson !== undefined) {
      note.contentJson = dto.contentJson;
    }
    if (dto.contentMarkdown !== undefined) {
      note.contentMarkdown = dto.contentMarkdown;
    }
    if (dto.projectId !== undefined) note.projectId = dto.projectId;
    if (dto.meetingDate !== undefined) {
      const nextMeetingDate = dto.meetingDate ? new Date(dto.meetingDate) : null;
      if (nextMeetingDate) {
        this.assertFutureMeetingDate(nextMeetingDate);
      }
      note.meetingDate = nextMeetingDate;
    }

    await this.notesRepo.save(note);
    return this.getById(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const note = await this.findOwned(userId, id);
    note.deletedAt = new Date();
    await this.notesRepo.save(note);
  }

  async archive(userId: string, id: string): Promise<NoteDetail> {
    const note = await this.findOwned(userId, id);
    note.archivedAt = new Date();
    await this.notesRepo.save(note);
    return this.getById(userId, id);
  }

  async unarchive(userId: string, id: string): Promise<NoteDetail> {
    const note = await this.findOwned(userId, id);
    note.archivedAt = null;
    await this.notesRepo.save(note);
    return this.getById(userId, id);
  }

  async addMember(
    userId: string,
    noteId: string,
    dto: AddNoteMemberDto,
  ): Promise<NoteDetail> {
    await this.findOwned(userId, noteId);

    const existing = await this.membersRepo.findOne({
      where: { noteId, email: dto.email.trim().toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('این عضو قبلاً اضافه شده است');
    }

    await this.membersRepo.save({
      noteId,
      displayName: dto.displayName.trim(),
      email: dto.email.trim().toLowerCase(),
    });

    return this.getById(userId, noteId);
  }

  async removeMember(
    userId: string,
    noteId: string,
    memberId: string,
  ): Promise<NoteDetail> {
    await this.findOwned(userId, noteId);
    const member = await this.membersRepo.findOne({
      where: { id: memberId, noteId },
    });
    if (!member) {
      throw new NotFoundException('عضو یافت نشد');
    }
    await this.membersRepo.remove(member);
    return this.getById(userId, noteId);
  }

  async updateSpeakerMappings(
    userId: string,
    noteId: string,
    dto: UpdateSpeakerMappingsDto,
  ): Promise<NoteDetail> {
    const note = await this.findOwned(userId, noteId);
    const rawTurns = parseTranscriptDocument(note.transcriptSegmentsJson ?? '').turns;

    if (!rawTurns.length) {
      throw new BadRequestException('برای این جلسه رونوشتی وجود ندارد');
    }

    const allowedSpeakerIds = new Set(rawTurns.map((turn) => turn.speakerId));
    const mappings: Record<string, string> = {};

    for (const [speakerId, rawName] of Object.entries(dto.mappings ?? {})) {
      if (!allowedSpeakerIds.has(speakerId)) continue;
      const name = sanitizeSpeakerName(rawName);
      if (!name) continue;
      if (name.length < 2) {
        throw new BadRequestException('نام گویننده باید حداقل ۲ کاراکتر باشد');
      }
      mappings[speakerId] = name;
    }

    note.speakerNameMappingsJson = serializeSpeakerNameMappings(mappings);

    const mappedTurns = applySpeakerMappingsToTurns(rawTurns, mappings);
    const flatTranscript = turnsToFlatTranscript(mappedTurns);
    note.transcriptText = flatTranscript;
    note.contentJson = this.resyncTranscriptInContent(note.contentJson, flatTranscript);

    await this.notesRepo.save(note);
    return this.getById(userId, noteId);
  }

  private resyncTranscriptInContent(contentJson: string, flatTranscript: string): string {
    if (!contentJson?.trim()) return contentJson;
    try {
      const doc = JSON.parse(contentJson) as Parameters<typeof syncTranscriptSection>[0];
      return JSON.stringify(syncTranscriptSection(doc, flatTranscript));
    } catch {
      return contentJson;
    }
  }

  private async findOwned(userId: string, id: string): Promise<Note> {
    const note = await this.notesRepo.findOne({
      where: { id, userId, deletedAt: IsNull() },
      relations: { project: true, members: true },
    });
    if (!note) {
      throw new NotFoundException('یادداشت یافت نشد');
    }
    return note;
  }

  private assertFutureMeetingDate(meetingDate: Date): void {
    const now = Date.now();
    if (meetingDate.getTime() <= now) {
      throw new BadRequestException(
        'تاریخ جلسه باید در آینده باشد',
      );
    }
  }

  private async assertProjectOwned(
    userId: string,
    projectId: string | null,
  ): Promise<void> {
    if (!projectId) return;
    const project = await this.projectsRepo.findOne({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new BadRequestException('پروژه معتبر نیست');
    }
    if (project.archivedAt) {
      throw new BadRequestException('پروژه آرشیو شده است');
    }
  }

  private toSearchHit(note: Note, query: string): NoteSearchHit {
    const match = resolveSearchMatch(
      note.title,
      note.contentJson ?? '',
      note.contentMarkdown ?? '',
      note.transcriptText ?? '',
      query,
    );

    return {
      id: note.id,
      title: note.title,
      meetingDate: note.meetingDate?.toISOString() ?? null,
      updatedAt: note.updatedAt.toISOString(),
      snippet: match.snippet,
      matchField: match.matchField,
      memberCount: note.members?.length ?? 0,
    };
  }

  private toSummary(note: Note): NoteSummary {
    return {
      id: note.id,
      title: note.title,
      projectId: note.projectId,
      projectName: note.project?.name ?? null,
      meetingDate: note.meetingDate?.toISOString() ?? null,
      memberCount: note.members?.length ?? 0,
      archivedAt: note.archivedAt?.toISOString() ?? null,
      deletedAt: note.deletedAt?.toISOString() ?? null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    };
  }

  private toDetail(note: Note): NoteDetail {
    const mappings = parseSpeakerNameMappings(note.speakerNameMappingsJson);
    const rawTurns = parseTranscriptDocument(note.transcriptSegmentsJson ?? '').turns;
    const mappedTurns = applySpeakerMappingsToTurns(rawTurns, mappings);

    return {
      ...this.toSummary(note),
      contentJson: note.contentJson,
      contentMarkdown: note.contentMarkdown,
      transcriptText: note.transcriptText ?? '',
      transcriptTurns: mappedTurns,
      recordingStatus: note.recordingStatus ?? 'idle',
      recordingStartedAt: note.recordingStartedAt?.toISOString() ?? null,
      recordingAudioUrl: note.recordingAudioUrl ?? null,
      members: (note.members ?? []).map((member) => this.toMember(member)),
      speakerMappings: mappings,
      speakers: buildSpeakerProfiles(rawTurns, mappings),
      aiExtractions: parseMeetingAiExtractions(note.aiExtractionsJson),
    };
  }

  private toMember(member: NoteMember): NoteMemberDto {
    return {
      id: member.id,
      displayName: member.displayName,
      email: member.email,
      createdAt: member.createdAt.toISOString(),
    };
  }
}
