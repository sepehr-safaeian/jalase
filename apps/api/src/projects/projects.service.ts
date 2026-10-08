import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type { Project as ProjectDto } from '@jalase/shared';
import { Project } from './entities/project.entity.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
  ) {}

  async list(userId: string, includeArchived = false): Promise<ProjectDto[]> {
    const projects = await this.projectsRepo.find({
      where: includeArchived
        ? { userId }
        : { userId, archivedAt: IsNull() },
      relations: { notes: true },
      order: { updatedAt: 'DESC' },
    });

    return projects.map((project) => this.toDto(project));
  }

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectDto> {
    const saved = await this.projectsRepo.save({
      userId,
      name: dto.name.trim(),
      color: dto.color ?? null,
    });
    return this.toDto(saved);
  }

  async getById(userId: string, id: string): Promise<ProjectDto> {
    const project = await this.findOwned(userId, id);
    return this.toDto(project);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    const project = await this.findOwned(userId, id);
    if (dto.name !== undefined) project.name = dto.name.trim();
    if (dto.color !== undefined) project.color = dto.color;
    const saved = await this.projectsRepo.save(project);
    return this.toDto(saved);
  }

  async archive(userId: string, id: string): Promise<ProjectDto> {
    const project = await this.findOwned(userId, id);
    project.archivedAt = new Date();
    const saved = await this.projectsRepo.save(project);
    return this.toDto(saved);
  }

  async unarchive(userId: string, id: string): Promise<ProjectDto> {
    const project = await this.findOwned(userId, id);
    project.archivedAt = null;
    const saved = await this.projectsRepo.save(project);
    return this.toDto(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const project = await this.findOwned(userId, id);
    await this.projectsRepo.remove(project);
  }

  private async findOwned(userId: string, id: string): Promise<Project> {
    const project = await this.projectsRepo.findOne({
      where: { id, userId },
      relations: { notes: true },
    });
    if (!project) {
      throw new NotFoundException('پروژه یافت نشد');
    }
    return project;
  }

  private toDto(project: Project): ProjectDto {
    const activeNotes =
      project.notes?.filter((note) => !note.deletedAt && !note.archivedAt) ?? [];

    return {
      id: project.id,
      name: project.name,
      color: project.color,
      archivedAt: project.archivedAt?.toISOString() ?? null,
      noteCount: activeNotes.length,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
