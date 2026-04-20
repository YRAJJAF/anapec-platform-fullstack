import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TestsService } from './tests.service';
import { CefrLevel } from '@prisma/client';

@ApiTags('tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  findAll(@Query('languageId') languageId?: string, @Query('cefrLevel') cefrLevel?: CefrLevel) {
    return this.testsService.findAll(languageId, cefrLevel);
  }

  @Get(':id')
  findById(@Param('id') id: string) { return this.testsService.findById(id); }

  @Get(':id/candidate')
  findForCandidate(@Param('id') id: string) { return this.testsService.findForCandidate(id); }

  @Get(':id/stats')
  getStats(@Param('id') id: string) { return this.testsService.getStats(id); }

  @Post()
  create(@Body() body: any) { return this.testsService.create(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.testsService.update(id, body); }

  @Post(':id/questions')
  addQuestion(@Param('id') id: string, @Body() body: any) { return this.testsService.addQuestion(id, body); }

  @Delete('questions/:questionId')
  deleteQuestion(@Param('questionId') qid: string) { return this.testsService.deleteQuestion(qid); }
}
