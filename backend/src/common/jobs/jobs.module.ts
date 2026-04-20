import { Module } from '@nestjs/common';
import { CleanupJob } from './cleanup.job';

@Module({ providers: [CleanupJob] })
export class JobsModule {}
