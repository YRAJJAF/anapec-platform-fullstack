import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupJob {
  private readonly logger = new Logger(CleanupJob.name);
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanExpiredRefreshTokens() {
    const { count } = await this.prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    if (count > 0) this.logger.log(`Cleaned ${count} expired refresh tokens`);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async timeoutStaleSessions() {
    const { count } = await this.prisma.testSession.updateMany({
      where: { status: 'IN_PROGRESS', expiresAt: { lt: new Date() } },
      data: { status: 'TIMED_OUT' },
    });
    if (count > 0) this.logger.log(`Timed out ${count} stale sessions`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async suspendInactiveUsers() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 45);
    const { count } = await this.prisma.user.updateMany({
      where: { role: 'CANDIDATE', isActive: true, OR: [{ lastLoginAt: { lt: cutoff } }, { lastLoginAt: null, createdAt: { lt: cutoff } }] },
      data: { isActive: false },
    });
    if (count > 0) this.logger.warn(`Suspended ${count} inactive users (45+ days)`);
  }

  @Cron('0 6 1 * *')
  async generateMonthlyReport() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [sessions, newUsers, certs] = await Promise.all([
      this.prisma.testSession.count({ where: { status: 'COMPLETED', completedAt: { gte: lastMonth, lt: thisMonth } } }),
      this.prisma.user.count({ where: { role: 'CANDIDATE', createdAt: { gte: lastMonth, lt: thisMonth } } }),
      this.prisma.certificate.count({ where: { issuedAt: { gte: lastMonth, lt: thisMonth } } }),
    ]);
    const month = lastMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    this.logger.log(`Monthly [${month}]: ${newUsers} users | ${sessions} tests | ${certs} certs`);
  }
}
