import { Controller, Get, Post, Put, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoachingService } from './coaching.service';

@ApiTags('coaching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coaching')
export class CoachingController {
  constructor(private readonly coaching: CoachingService) {}

  @Post('schedule')
  schedule(@Request() req: any, @Body() body: any) {
    return this.coaching.schedule(req.user.sub, body.candidateId, body);
  }

  @Put(':id/status')
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.coaching.updateStatus(id, req.user.sub, body.status, body);
  }

  @Get('my-sessions')
  mySessions(@Request() req: any) {
    return this.coaching.findForCandidate(req.user.sub);
  }

  @Get('my-candidates')
  myCandidates(@Request() req: any) {
    return this.coaching.findForCoach(req.user.sub);
  }
}
