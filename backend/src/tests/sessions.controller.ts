import { Controller, Get, Post, Body, Param, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { StorageService } from '../common/storage/storage.service';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService, private readonly storage: StorageService) {}

  @Post('start')
  start(@Request() req: any, @Body() body: { testId: string }) {
    return this.sessions.startSession(req.user.sub, body.testId);
  }

  @Post(':id/answer')
  submitAnswer(@Request() req: any, @Param('id') sid: string, @Body() body: { questionId: string; userAnswer?: string; audioUrl?: string }) {
    return this.sessions.submitAnswer(sid, req.user.sub, body.questionId, body.userAnswer, body.audioUrl);
  }

  @Post(':id/answer/audio')
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async submitAudioAnswer(@Request() req: any, @Param('id') sid: string, @Body() body: { questionId: string }, @UploadedFile() file: Express.Multer.File) {
    const audioUrl = await this.storage.uploadFile(file.buffer, `sessions/${sid}/audio-${body.questionId}.webm`, file.mimetype);
    return this.sessions.submitAnswer(sid, req.user.sub, body.questionId, undefined, audioUrl);
  }

  @Post(':id/complete')
  complete(@Request() req: any, @Param('id') sid: string) {
    return this.sessions.completeSession(sid, req.user.sub);
  }

  @Get('my')
  mySessions(@Request() req: any) { return this.sessions.findUserSessions(req.user.sub); }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') sid: string) { return this.sessions.findSessionById(sid, req.user.sub); }
}
