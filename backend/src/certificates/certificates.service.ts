import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { CefrLevel } from '@prisma/client';
import PDFDocument from 'pdfkit';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async issue(userId: string, sessionId: string, cefrLevel: CefrLevel, language: string) {
    // Avoid duplicates
    const existing = await this.prisma.certificate.findFirst({
      where: { userId, sessionId },
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const pdfBuffer = await this.generatePdf({
      firstName: user.firstName,
      lastName: user.lastName,
      cin: user.cin ?? '',
      cefrLevel,
      language,
      issuedAt: new Date(),
    });

    const key = `certificates/${userId}/${sessionId}.pdf`;
    const url = await this.storage.uploadFile(pdfBuffer, key, 'application/pdf');

    return this.prisma.certificate.create({
      data: { userId, sessionId, cefrLevel, language, certificateUrl: url },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: { session: { include: { test: { include: { language: true } } } } },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.certificate.findUnique({
      where: { id },
      include: { user: true, session: true },
    });
  }

  private async generatePdf(data: {
    firstName: string;
    lastName: string;
    cin: string;
    cefrLevel: CefrLevel;
    language: string;
    issuedAt: Date;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 60 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageW = doc.page.width;
      const pageH = doc.page.height;

      // Background
      doc.rect(0, 0, pageW, pageH).fill('#F8F9FA');

      // Border
      doc
        .rect(20, 20, pageW - 40, pageH - 40)
        .lineWidth(3)
        .stroke('#1A5F7A');

      doc
        .rect(30, 30, pageW - 60, pageH - 60)
        .lineWidth(1)
        .stroke('#C9A84C');

      // Header
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#1A5F7A')
        .text('AGENCE NATIONALE DE PROMOTION DE L\'EMPLOI ET DES COMPÉTENCES', 0, 55, {
          align: 'center',
          width: pageW,
        });

      doc
        .fontSize(11)
        .fillColor('#555')
        .text('Plateforme de Tests de Langues et de Remédiation Linguistique', 0, 80, {
          align: 'center',
          width: pageW,
        });

      // Divider
      doc.moveTo(80, 105).lineTo(pageW - 80, 105).lineWidth(1).stroke('#C9A84C');

      // Title
      doc
        .font('Helvetica-Bold')
        .fontSize(30)
        .fillColor('#C9A84C')
        .text('CERTIFICAT DE NIVEAU LINGUISTIQUE', 0, 125, { align: 'center', width: pageW });

      // CEFR badge
      const badgeX = pageW / 2 - 50;
      doc.roundedRect(badgeX, 165, 100, 55, 8).fill('#1A5F7A');
      doc
        .font('Helvetica-Bold')
        .fontSize(32)
        .fillColor('#FFFFFF')
        .text(data.cefrLevel, badgeX, 175, { width: 100, align: 'center' });

      // Body
      doc
        .font('Helvetica')
        .fontSize(14)
        .fillColor('#333')
        .text('Nous certifions que', 0, 240, { align: 'center', width: pageW });

      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#1A5F7A')
        .text(`${data.firstName.toUpperCase()} ${data.lastName.toUpperCase()}`, 0, 265, {
          align: 'center',
          width: pageW,
        });

      if (data.cin) {
        doc
          .font('Helvetica')
          .fontSize(12)
          .fillColor('#666')
          .text(`CIN: ${data.cin}`, 0, 295, { align: 'center', width: pageW });
      }

      const langNames: Record<string, string> = {
        fr: 'Français',
        de: 'Allemand',
        en: 'Anglais',
        es: 'Espagnol',
        it: 'Italien',
        pt: 'Portugais',
        nl: 'Néerlandais',
        ar: 'Arabe classique',
      };
      const langName = langNames[data.language] ?? data.language;

      doc
        .font('Helvetica')
        .fontSize(14)
        .fillColor('#333')
        .text(
          `a atteint le niveau ${data.cefrLevel} du Cadre Européen Commun de Référence pour les Langues (CECRL) en`,
          0,
          320,
          { align: 'center', width: pageW },
        );

      doc
        .font('Helvetica-Bold')
        .fontSize(18)
        .fillColor('#1A5F7A')
        .text(langName, 0, 348, { align: 'center', width: pageW });

      // Date and signature line
      const dateStr = data.issuedAt.toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor('#555')
        .text(`Délivré le ${dateStr}`, 100, pageH - 110);

      doc.moveTo(pageW - 280, pageH - 90).lineTo(pageW - 80, pageH - 90).stroke('#333');
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#555')
        .text('Signature autorisée', pageW - 280, pageH - 80, { width: 200, align: 'center' });

      doc.end();
    });
  }
}
