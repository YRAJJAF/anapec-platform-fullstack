import { Controller, Get, Post, Put, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RemediationService } from './remediation.service';
import { CefrLevel } from '@prisma/client';

@ApiTags('remediation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('remediation')
export class RemediationController {
  constructor(private readonly service: RemediationService) {}

  @Get('courses')
  getCourses(@Query('languageId') languageId?: string, @Query('cefrLevel') cefrLevel?: CefrLevel) {
    return this.service.getCourses(languageId, cefrLevel);
  }

  @Get('courses/:id')
  getCourse(@Param('id') id: string, @Request() req: any) {
    return this.service.getCourse(id, req.user.sub);
  }

  @Post('courses/:id/enroll')
  enroll(@Param('id') courseId: string, @Request() req: any) {
    return this.service.enroll(req.user.sub, courseId);
  }

  @Put('courses/:courseId/lessons/:lessonId/complete')
  complete(@Param('courseId') cid: string, @Param('lessonId') lid: string, @Request() req: any) {
    return this.service.updateProgress(req.user.sub, cid, lid);
  }

  @Get('recommendations')
  getRecommendations(@Request() req: any) {
    return this.service.getRecommendations(req.user.sub);
  }

  @Get('my-enrollments')
  getMyEnrollments(@Request() req: any) {
    return this.service.getMyEnrollments(req.user.sub);
  }
}
