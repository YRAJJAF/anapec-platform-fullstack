import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ScoringService } from './scoring.service';
import { AiScoringService } from '../ai-scoring/ai-scoring.service';
import { CertificatesService } from '../certificates/certificates.service';
import { SessionStatus } from '@prisma/client';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
    private readonly aiScoring: AiScoringService,
    private readonly certificates: CertificatesService,
  ) {}

  async startSession(userId: string, testId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId, isActive: true },
      include: { questions: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!test) throw new NotFoundException('Test not found');

    // Check if active session already exists
    const existing = await this.prisma.testSession.findFirst({
      where: { userId, testId, status: 'IN_PROGRESS' },
    });
    if (existing) {
      // Resume existing session
      return { session: existing, resumed: true };
    }

    const expiresAt = new Date(Date.now() + test.durationMinutes * 60 * 1000);
    const session = await this.prisma.testSession.create({
      data: {
        userId,
        testId,
        status: SessionStatus.IN_PROGRESS,
        startedAt: new Date(),
        expiresAt,
      },
    });

    return { session, test, resumed: false };
  }

  async submitAnswer(
    sessionId: string,
    userId: string,
    questionId: string,
    userAnswer?: string,
    audioUrl?: string,
  ) {
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: { test: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    if (session.status !== 'IN_PROGRESS') throw new BadRequestException('Session is not active');

    // Check timer
    if (session.expiresAt && new Date() > session.expiresAt) {
      await this.completeSession(sessionId, userId);
      throw new BadRequestException('Session has timed out');
    }

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question || question.testId !== session.testId) {
      throw new NotFoundException('Question not found in this test');
    }

    let isCorrect: boolean | null = null;
    let aiScore: number | null = null;
    let aiFeedback: string | null = null;

    // Auto-grade objective questions
    if (
      ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'ORDERING'].includes(question.type)
    ) {
      isCorrect = question.correctAnswer === userAnswer;
    }

    // AI grading for speaking (async — result stored separately)
    if (question.type === 'SPEAKING' && audioUrl) {
      try {
        const result = await this.aiScoring.scoreSpeaking(audioUrl, question.content);
        aiScore = result.score;
        aiFeedback = result.feedback;
      } catch {
        aiScore = null; // Will be graded manually if AI fails
      }
    }

    // AI grading for writing
    if (question.type === 'WRITING' && userAnswer) {
      try {
        const result = await this.aiScoring.scoreWriting(userAnswer, question.content, session.test.cefrTarget);
        aiScore = result.score;
        aiFeedback = result.feedback;
      } catch {
        aiScore = null;
      }
    }

    const pointsEarned =
      isCorrect === true
        ? question.points
        : isCorrect === false
          ? 0
          : aiScore !== null
            ? Math.round((aiScore / 100) * question.points)
            : null;

    return this.prisma.answer.upsert({
      where: { sessionId_questionId: { sessionId, questionId } },
      create: { sessionId, questionId, userAnswer, audioUrl, isCorrect, aiScore, aiFeedback, pointsEarned },
      update: { userAnswer, audioUrl, isCorrect, aiScore, aiFeedback, pointsEarned },
    });
  }

  async completeSession(sessionId: string, userId: string) {
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        test: true,
        answers: { include: { question: true } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    if (session.status === 'COMPLETED') return session;

    const result = this.scoring.calculateScore(
      session.answers,
      session.test.cefrTarget,
      session.test.passingScore,
    );

    const timeTakenSecs = session.startedAt
      ? Math.round((Date.now() - session.startedAt.getTime()) / 1000)
      : null;

    const completed = await this.prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt: new Date(),
        score: result.score,
        totalPoints: result.totalPoints,
        earnedPoints: result.earnedPoints,
        cefrResult: result.cefrLevel,
        timeTakenSecs,
      },
      include: { test: { include: { language: true } } },
    });

    // Auto-issue certificate if passed
    if (result.passed) {
      await this.certificates.issue(userId, sessionId, result.cefrLevel, completed.test.language.code);
    }

    return { session: completed, result };
  }

  async findUserSessions(userId: string) {
    return this.prisma.testSession.findMany({
      where: { userId },
      include: {
        test: { include: { language: { select: { code: true, name: true, nameAr: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findSessionById(sessionId: string, userId: string) {
    const session = await this.prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        test: { include: { language: true } },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                type: true,
                content: true,
                contentAr: true,
                options: true,
                points: true,
                cefrLevel: true,
              },
            },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();
    return session;
  }
}
