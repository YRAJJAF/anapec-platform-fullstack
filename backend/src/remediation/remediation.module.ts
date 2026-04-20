import { Module } from '@nestjs/common';
import { RemediationService } from './remediation.service';
import { RemediationController } from './remediation.controller';

@Module({
  providers: [RemediationService],
  controllers: [RemediationController],
  exports: [RemediationService],
})
export class RemediationModule {}
