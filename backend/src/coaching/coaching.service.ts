import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CoachingStatus } from '@prisma/client';

@Injectable()
export class CoachingService {
  constructor(private readonly prisma: PrismaService) {}

  async schedule(coachId: string, candidateId: string, data: { language: string; scheduledAt: Date; durationMinutes: number; meetingUrl?: string }) {
    return this.prisma.coachingSession.create({ data: { coachId, candidateId, ...data } });
  }

  async updateStatus(sessionId: string, coachId: string, status: CoachingStatus, data?: { notes?: string; logUrl?: string; attendanceScreenshot?: string }) {
    const session = await this.prisma.coachingSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.coachId !== coachId) throw new ForbiddenException();
    return this.prisma.coachingSession.update({ where: { id: sessionId }, data: { status, ...data } });
  }

  async findForCandidate(candidateId: string) {
    return this.prisma.coachingSession.findMany({
      where: { candidateId },
      include: { coach: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findForCoach(coachId: string) {
    return this.prisma.coachingSession.findMany({
      where: { coachId },
      include: { candidate: { select: { firstName: true, lastName: true, email: true, cin: true, region: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
