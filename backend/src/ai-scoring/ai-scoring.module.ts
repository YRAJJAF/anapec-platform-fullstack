import { Module } from '@nestjs/common';
import { AiScoringService } from './ai-scoring.service';
import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [AiScoringService],
  exports: [AiScoringService],
})
export class AiScoringModule {}
