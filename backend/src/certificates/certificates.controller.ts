import { Controller, Get, Param, Request, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CertificatesService } from './certificates.service';
import { StorageService } from '../common/storage/storage.service';
import { Response } from 'express';

@ApiTags('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificates: CertificatesService, private readonly storage: StorageService) {}

  @Get('my')
  findMine(@Request() req: any) { return this.certificates.findByUser(req.user.sub); }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const cert = await this.certificates.findById(id);
    if (!cert?.certificateUrl) return res.status(404).json({ message: 'Not found' });
    const keyPart = cert.certificateUrl.split('certificates/')[1];
    const url = await this.storage.getSignedUrl(`certificates/${keyPart}`);
    return res.redirect(url);
  }
}
