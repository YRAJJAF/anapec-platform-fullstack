import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CefrLevel } from '@prisma/client';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformOverview() {
    const [
      totalUsers,
      activeUsers,
      totalSessions,
      completedSessions,
      totalCertificates,
      cefrDistribution,
      languageBreakdown,
      recentActivity,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CANDIDATE' } }),
      this.prisma.user.count({ where: { role: 'CANDIDATE', isActive: true } }),
      this.prisma.testSession.count(),
      this.prisma.testSession.count({ where: { status: 'COMPLETED' } }),
      this.prisma.certificate.count(),
      this.prisma.testSession.groupBy({
        by: ['cefrResult'],
        where: { status: 'COMPLETED', cefrResult: { not: null } },
        _count: true,
        orderBy: { cefrResult: 'asc' },
      }),
      this.prisma.testSession.groupBy({
        by: ['testId'],
        where: { status: 'COMPLETED' },
        _count: true,
        _avg: { score: true },
      }),
      this.prisma.testSession.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true, city: true } },
          test: { include: { language: { select: { name: true, code: true } } } },
        },
      }),
    ]);

    const avgScore = await this.prisma.testSession.aggregate({
      where: { status: 'COMPLETED' },
      _avg: { score: true },
    });

    return {
      totals: {
        users: totalUsers,
        activeUsers,
        sessions: totalSessions,
        completedSessions,
        certificates: totalCertificates,
        completionRate: totalSessions > 0
          ? Math.round((completedSessions / totalSessions) * 100)
          : 0,
        avgScore: Math.round((avgScore._avg.score ?? 0) * 100) / 100,
      },
      cefrDistribution,
      languageBreakdown,
      recentActivity,
    };
  }

  async getUsersReport(region?: string, city?: string, agency?: string) {
    const where = {
      role: 'CANDIDATE' as const,
      ...(region && { region }),
      ...(city && { city }),
      ...(agency && { agency }),
    };

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        cin: true,
        region: true,
        city: true,
        agency: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { testSessions: true, certificates: true } },
        testSessions: {
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: { cefrResult: true, score: true, completedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async getRegionalStats() {
    const byRegion = await this.prisma.user.groupBy({
      by: ['region'],
      where: { role: 'CANDIDATE', region: { not: null } },
      _count: true,
    });

    const cefrByRegion = await this.prisma.$queryRaw<{
      region: string;
      cefr_result: CefrLevel;
      count: bigint;
    }[]>`
      SELECT u.region, ts.cefr_result, COUNT(*) as count
      FROM users u
      JOIN test_sessions ts ON ts.user_id = u.id
      WHERE ts.status = 'COMPLETED' AND ts.cefr_result IS NOT NULL AND u.region IS NOT NULL
      GROUP BY u.region, ts.cefr_result
      ORDER BY u.region, ts.cefr_result
    `;

    return { byRegion, cefrByRegion };
  }

  async getProgressReport(userId: string) {
    const sessions = await this.prisma.testSession.findMany({
      where: { userId, status: 'COMPLETED' },
      include: {
        test: { include: { language: { select: { code: true, name: true } } } },
      },
      orderBy: { completedAt: 'asc' },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: { course: { include: { language: { select: { code: true, name: true } } } } },
      orderBy: { enrolledAt: 'asc' },
    });

    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });

    return { sessions, enrollments, certificates };
  }

  async getEngagementMetrics(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const dailySignups = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE role = 'CANDIDATE' AND created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const dailySessions = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(completed_at) as date, COUNT(*) as count
      FROM test_sessions
      WHERE status = 'COMPLETED' AND completed_at >= ${since}
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `;

    return { dailySignups, dailySessions };
  }
}
