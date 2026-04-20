import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { StorageModule } from './common/storage/storage.module';
import { MailModule } from './common/mail/mail.module';
import { JobsModule } from './common/jobs/jobs.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LanguagesModule } from './languages/languages.module';
import { TestsModule } from './tests/tests.module';
import { RemediationModule } from './remediation/remediation.module';
import { ReportingModule } from './reporting/reporting.module';
import { CertificatesModule } from './certificates/certificates.module';
import { CoachingModule } from './coaching/coaching.module';
import { AiScoringModule } from './ai-scoring/ai-scoring.module';
import configuration from './common/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], envFilePath: ['.env.local', '.env'] }),
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,    limit: 20  },
      { name: 'medium', ttl: 60000,   limit: 200 },
      { name: 'long',   ttl: 3600000, limit: 1000 },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    StorageModule,
    MailModule,
    JobsModule,
    AuthModule,
    UsersModule,
    LanguagesModule,
    TestsModule,
    RemediationModule,
    ReportingModule,
    CertificatesModule,
    CoachingModule,
    AiScoringModule,
  ],
})
export class AppModule {}
