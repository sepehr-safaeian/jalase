import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { NotesService } from './notes.service.js';
import type { Note } from './entities/note.entity.js';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    userId: 'u1',
    projectId: null,
    project: null,
    title: 'جلسه',
    contentJson: '{"type":"doc","content":[]}',
    contentMarkdown: '# hello',
    transcriptText: '',
    transcriptSegmentsJson: '',
    recordingStatus: 'idle',
    recordingStartedAt: null,
    transcriptContext: '',
    meetingDate: new Date(),
    archivedAt: null,
    deletedAt: null,
    members: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Note;
}

describe('NotesService', () => {
  let service: NotesService;
  let notesRepo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let membersRepo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let projectsRepo: {
    findOne: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    notesRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    membersRepo = {
      findOne: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
    };
    projectsRepo = {
      findOne: vi.fn(),
    };

    service = new NotesService(
      notesRepo as never,
      membersRepo as never,
      projectsRepo as never,
    );
  });

  it('getById یادداشت متعلق به کاربر را برمی‌گرداند', async () => {
    const note = makeNote();
    notesRepo.findOne.mockResolvedValue(note);

    const result = await service.getById('u1', 'n1');
    expect(result.title).toBe('جلسه');
    expect(result.contentJson).toBe('{"type":"doc","content":[]}');
    expect(result.archivedAt).toBeNull();
    expect(result.deletedAt).toBeNull();
  });

  it('getById برای یادداشت ناموجود خطا می‌دهد', async () => {
    notesRepo.findOne.mockResolvedValue(null);
    await expect(service.getById('u1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('list یادداشت‌های آرشیو و حذف‌شده را پیش‌فرض فیلتر می‌کند', async () => {
    notesRepo.find.mockResolvedValue([]);

    await service.list('u1');

    expect(notesRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'u1',
          deletedAt: expect.anything(),
          archivedAt: expect.anything(),
        }),
      }),
    );
  });

  it('remove یادداشت را حذف نرم می‌کند', async () => {
    const note = makeNote();
    notesRepo.findOne.mockResolvedValue(note);
    notesRepo.save.mockResolvedValue(note);

    await service.remove('u1', 'n1');

    expect(notesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    );
    expect(notesRepo.remove).not.toHaveBeenCalled();
  });

  it('archive یادداشت را آرشیو می‌کند', async () => {
    const note = makeNote();
    notesRepo.findOne.mockResolvedValue(note);
    notesRepo.save.mockImplementation(async (payload) => payload);

    const result = await service.archive('u1', 'n1');

    expect(notesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ archivedAt: expect.any(Date) }),
    );
    expect(result.id).toBe('n1');
  });

  it('create با meetingDate گذشته خطا می‌دهد', async () => {
    const past = new Date(Date.now() - 60_000).toISOString();

    await expect(
      service.create('u1', { meetingDate: past }),
    ).rejects.toMatchObject({
      message: 'تاریخ جلسه باید در آینده باشد',
    });
  });

  it('create با meetingDate آینده meetingDate را ذخیره می‌کند', async () => {
    const future = new Date(Date.now() + 60 * 60_000);
    const saved = makeNote({ meetingDate: future });
    notesRepo.save.mockResolvedValue(saved);
    notesRepo.findOne.mockResolvedValue(saved);

    const result = await service.create('u1', {
      meetingDate: future.toISOString(),
      title: 'جلسه آینده',
    });

    expect(notesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        meetingDate: expect.any(Date),
        title: 'جلسه آینده',
      }),
    );
    expect(result.title).toBe('جلسه');
  });

  it('search نتایج ۳۰ روز اخیر را برمی‌گرداند', async () => {
    const note = makeNote({ title: 'جلسه جیرا' });
    const qb = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([note]),
    };
    notesRepo.createQueryBuilder = vi.fn().mockReturnValue(qb);

    const result = await service.search('u1', { q: 'جیرا', scope: 'recent' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('جلسه جیرا');
    expect(result.scope).toBe('recent');
    expect(result.expandableToOlder).toBe(true);
    expect(result.hasMore).toBe(false);
  });

  it('listMeetings جلسات تب امروز را با بازه meeting_date برمی‌گرداند', async () => {
    const note = makeNote({ id: 'today-1', title: 'امروز' });
    const qb = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([note]),
    };
    notesRepo.createQueryBuilder = vi.fn().mockReturnValue(qb);

    const result = await service.listMeetings('u1', {
      bucket: 'today',
      tzOffsetMinutes: 210,
    });

    expect(result.bucket).toBe('today');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('امروز');
    expect(result.hasMore).toBe(false);
    expect(qb.andWhere).toHaveBeenCalledWith(
      'note.meeting_date >= :rangeStart',
      expect.objectContaining({ rangeStart: expect.any(Date) }),
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      'note.meeting_date < :rangeEnd',
      expect.objectContaining({ rangeEnd: expect.any(Date) }),
    );
  });

  it('listMeetings برای past صفحه‌بندی cursor دارد', async () => {
    const notes = Array.from({ length: 21 }, (_, index) =>
      makeNote({
        id: `past-${index}`,
        meetingDate: new Date(Date.UTC(2024, 0, 20 - index)),
      }),
    );
    const qb = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue(notes),
    };
    notesRepo.createQueryBuilder = vi.fn().mockReturnValue(qb);

    const result = await service.listMeetings('u1', {
      bucket: 'past',
      tzOffsetMinutes: 210,
      limit: 20,
    });

    expect(result.items).toHaveLength(20);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeTruthy();
  });
});
