import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CefrLevel } from '@prisma/client';

@Injectable()
export class RemediationService {
  constructor(private readonly prisma: PrismaService) {}

  async getCourses(languageId?: string, cefrLevel?: CefrLevel) {
    return this.prisma.course.findMany({
      where: { isActive: true, ...(languageId && { languageId }), ...(cefrLevel && { cefrLevel }) },
      include: { language: { select: { code: true, name: true, nameAr: true } }, _count: { select: { lessons: true, enrollments: true } } },
      orderBy: [{ cefrLevel: 'asc' }, { orderIndex: 'asc' }],
    });
  }

  async getCourse(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { language: true, lessons: { where: { isActive: true }, orderBy: { orderIndex: 'asc' } } },
    });
    if (!course) throw new NotFoundException('Course not found');
    const enrollment = await this.prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
    return { ...course, enrollment };
  }

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: 'ACTIVE' },
      update: { status: 'ACTIVE', lastAccessAt: new Date() },
    });
  }

  async updateProgress(userId: string, courseId: string, lessonId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, include: { lessons: { where: { isActive: true } } } });
    if (!course) throw new NotFoundException('Course not found');
    const enrollment = await this.prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
    if (!enrollment) throw new NotFoundException('Not enrolled');
    const total = course.lessons.length;
    const done = Math.floor((enrollment.progressPct / 100) * total) + 1;
    const progressPct = Math.min((done / total) * 100, 100);
    const status = progressPct >= 100 ? 'COMPLETED' : 'ACTIVE';
    return this.prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { progressPct, status, lastAccessAt: new Date(), ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}) },
    });
  }

  async getRecommendations(userId: string) {
    const lastSession = await this.prisma.testSession.findFirst({
      where: { userId, status: 'COMPLETED', cefrResult: { not: null } },
      orderBy: { completedAt: 'desc' },
      include: { test: { include: { language: true } } },
    });
    if (!lastSession?.cefrResult) {
      return this.prisma.course.findMany({ where: { isActive: true, cefrLevel: 'A1' }, include: { language: true }, take: 4 });
    }
    const levels: CefrLevel[] = ['A1','A2','B1','B2','C1','C2'];
    const idx = levels.indexOf(lastSession.cefrResult);
    const recLevels = [lastSession.cefrResult, levels[Math.min(idx+1,levels.length-1)]];
    return this.prisma.course.findMany({
      where: { isActive: true, languageId: lastSession.test.languageId, cefrLevel: { in: recLevels } },
      include: { language: true },
      orderBy: { orderIndex: 'asc' },
      take: 6,
    });
  }

  async getMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: { include: { language: { select: { code: true, name: true, nameAr: true } }, _count: { select: { lessons: true } } } } },
      orderBy: { lastAccessAt: 'desc' },
    });
  }
}
