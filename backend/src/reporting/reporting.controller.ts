import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportingService } from './reporting.service';

@ApiTags('reporting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reporting')
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get('overview')
  getOverview() { return this.reporting.getPlatformOverview(); }

  @Get('users')
  getUsers(@Query('region') region?: string, @Query('city') city?: string, @Query('agency') agency?: string) {
    return this.reporting.getUsersReport(region, city, agency);
  }

  @Get('regional')
  getRegional() { return this.reporting.getRegionalStats(); }

  @Get('engagement')
  getEngagement(@Query('days') days?: number) { return this.reporting.getEngagementMetrics(days ?? 30); }

  @Get('my-progress')
  getMyProgress(@Request() req: any) { return this.reporting.getProgressReport(req.user.sub); }
}
