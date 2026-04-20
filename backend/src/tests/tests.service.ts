import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CefrLevel, QuestionType } from '@prisma/client';

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(languageId?: string, cefrLevel?: CefrLevel) {
    return this.prisma.test.findMany({
      where: {
        isActive: true,
        ...(languageId && { languageId }),
        ...(cefrLevel && { cefrTarget: cefrLevel }),
      },
      include: {
        language: { select: { code: true, name: true, nameAr: true } },
        _count: { select: { questions: true, sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: {
        language: true,
        questions: { orderBy: { orderIndex: 'asc' } },
        _count: { select: { sessions: true } },
      },
    });
    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  async findForCandidate(id: string) {
    const test = await this.prisma.test.findUnique({
      where: { id, isActive: true },
      include: {
        language: { select: { code: true, name: true, nameAr: true } },
        questions: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            type: true,
            content: true,
            contentAr: true,
            options: true,
            audioUrl: true,
            imageUrl: true,
            points: true,
            orderIndex: true,
            cefrLevel: true,
            // correctAnswer omitted for candidates
          },
        },
      },
    });
    if (!test) throw new NotFoundException('Test not found');
    return test;
  }

  async create(data: {
    languageId: string;
    title: string;
    description?: string;
    cefrTarget: CefrLevel;
    durationMinutes: number;
    passingScore?: number;
    isAdaptive?: boolean;
    instructions?: string;
  }) {
    return this.prisma.test.create({ data });
  }

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    cefrTarget: CefrLevel;
    durationMinutes: number;
    passingScore: number;
    isActive: boolean;
    instructions: string;
  }>) {
    await this.findById(id);
    return this.prisma.test.update({ where: { id }, data });
  }

  async addQuestion(testId: string, data: {
    type: QuestionType;
    content: string;
    contentAr?: string;
    options?: object;
    correctAnswer?: string;
    audioUrl?: string;
    imageUrl?: string;
    points?: number;
    cefrLevel?: CefrLevel;
    explanation?: string;
  }) {
    await this.findById(testId);
    const maxOrder = await this.prisma.question.aggregate({
      where: { testId },
      _max: { orderIndex: true },
    });
    const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;
    return this.prisma.question.create({ data: { ...data, testId, orderIndex } });
  }

  async deleteQuestion(questionId: string) {
    await this.prisma.question.delete({ where: { id: questionId } });
  }

  async getStats(testId: string) {
    const [sessions, avgScore, passingCount] = await Promise.all([
      this.prisma.testSession.count({ where: { testId, status: 'COMPLETED' } }),
      this.prisma.testSession.aggregate({
        where: { testId, status: 'COMPLETED' },
        _avg: { score: true },
      }),
      this.prisma.testSession.count({
        where: {
          testId,
          status: 'COMPLETED',
          score: { gte: 60 },
        },
      }),
    ]);

    const cefrDistribution = await this.prisma.testSession.groupBy({
      by: ['cefrResult'],
      where: { testId, status: 'COMPLETED', cefrResult: { not: null } },
      _count: true,
    });

    return {
      totalSessions: sessions,
      avgScore: Math.round((avgScore._avg.score ?? 0) * 100) / 100,
      passingRate: sessions > 0 ? Math.round((passingCount / sessions) * 100) : 0,
      cefrDistribution,
    };
  }
}
