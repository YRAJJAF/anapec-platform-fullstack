import { Controller, Get, Put, Post, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('role') role?: Role, @Query('region') region?: string, @Query('agency') agency?: string) {
    return this.usersService.findAll(role, region, agency);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put('me')
  updateMe(@Request() req: any, @Body() body: any) {
    return this.usersService.update(req.user.sub, body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Put(':id/active')
  setActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.usersService.setActive(id, body.isActive);
  }

  @Put(':id/role')
  setRole(@Param('id') id: string, @Body() body: { role: Role }) {
    return this.usersService.setRole(id, body.role);
  }

  @Post('bulk-import')
  bulkImport(@Body() body: { users: any[] }) {
    return this.usersService.bulkImport(body.users);
  }
}
