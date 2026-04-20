import { Module } from '@nestjs/common';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { ScoringService } from './scoring.service';
import { AiScoringModule } from '../ai-scoring/ai-scoring.module';
import { StorageModule } from '../common/storage/storage.module';
import { CertificatesModule } from '../certificates/certificates.module';

@Module({
  imports: [AiScoringModule, StorageModule, CertificatesModule],
  providers: [TestsService, SessionsService, ScoringService],
  controllers: [TestsController, SessionsController],
  exports: [TestsService, SessionsService],
})
export class TestsModule {}
