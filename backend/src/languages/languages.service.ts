import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class LanguagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.language.findMany({
      where: { isActive: true },
      include: { _count: { select: { tests: true, courses: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async seed() {
    const languages = [
      { code:'fr', name:'Français', nameAr:'الفرنسية' },
      { code:'de', name:'Allemand', nameAr:'الألمانية' },
      { code:'en', name:'Anglais', nameAr:'الإنجليزية' },
      { code:'es', name:'Espagnol', nameAr:'الإسبانية' },
      { code:'it', name:'Italien', nameAr:'الإيطالية' },
      { code:'pt', name:'Portugais', nameAr:'البرتغالية' },
      { code:'nl', name:'Néerlandais', nameAr:'الهولندية' },
      { code:'ar', name:'Arabe classique', nameAr:'العربية الفصحى' },
    ];
    return Promise.all(languages.map(l =>
      this.prisma.language.upsert({ where: { code: l.code }, update: {}, create: l })
    ));
  }
}
