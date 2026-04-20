// ── users.service.ts ─────────────────────────────────────────────────────────
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        cin: true,
        phone: true,
        region: true,
        city: true,
        agency: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { testSessions: true, certificates: true, enrollments: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll(role?: Role, region?: string, agency?: string) {
    return this.prisma.user.findMany({
      where: {
        ...(role && { role }),
        ...(region && { region }),
        ...(agency && { agency }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        cin: true,
        phone: true,
        region: true,
        city: true,
        agency: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { testSessions: true, certificates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    region: string;
    city: string;
    agency: string;
  }>) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async setActive(id: string, isActive: boolean) {
    return this.prisma.user.update({ where: { id }, data: { isActive } });
  }

  async setRole(id: string, role: Role) {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async bulkImport(users: Array<{
    email: string;
    firstName: string;
    lastName: string;
    cin?: string;
    region?: string;
    city?: string;
    agency?: string;
    phone?: string;
  }>) {
    const bcrypt = await import('bcryptjs');
    const defaultPassword = await bcrypt.hash('Anapec2024!', 10);
    const created: string[] = [];
    const skipped: string[] = [];

    for (const u of users) {
      const existing = await this.prisma.user.findFirst({
        where: { OR: [{ email: u.email }, ...(u.cin ? [{ cin: u.cin }] : [])] },
      });
      if (existing) { skipped.push(u.email); continue; }

      await this.prisma.user.create({
        data: { ...u, passwordHash: defaultPassword, role: Role.CANDIDATE },
      });
      created.push(u.email);
    }

    return { created: created.length, skipped: skipped.length, details: { created, skipped } };
  }
}

// ── users.module.ts 