import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('mail.host');
    const user = this.config.get<string>('mail.user');
    if (host && user) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('mail.port', 587),
        secure: false,
        auth: { user, pass: this.config.get<string>('mail.pass') },
      });
    } else {
      this.logger.warn('Mail not configured — emails will be logged only');
    }
  }

  async send(opts: MailOptions) {
    if (!this.transporter) {
      this.logger.log(`[EMAIL-DEV] To: ${opts.to} | Subject: ${opts.subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('mail.from', 'noreply@anapec-platform.ma'),
        ...opts,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}`, err);
    }
  }

  async sendWelcome(firstName: string, email: string) {
    await this.send({
      to: email,
      subject: 'Bienvenue sur la Plateforme Linguistique ANAPEC',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="background:#1A5F7A;padding:24px;border-radius:12px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px">Plateforme Linguistique ANAPEC</h1>
          </div>
          <div style="padding:32px 0">
            <h2 style="color:#1A5F7A">Bonjour ${firstName},</h2>
            <p style="color:#555;line-height:1.6">
              Bienvenue sur la plateforme de tests de langues et de remédiation linguistique de l'ANAPEC.
            </p>
            <p style="color:#555;line-height:1.6">
              Vous pouvez maintenant :
            </p>
            <ul style="color:#555;line-height:2">
              <li>Passer des tests de niveau dans <strong>8 langues</strong></li>
              <li>Accéder à des parcours de remédiation personnalisés</li>
              <li>Obtenir des <strong>certifications CECRL</strong> reconnues</li>
            </ul>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login"
               style="display:inline-block;margin-top:24px;padding:14px 32px;background:#1A5F7A;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold">
              Accéder à la plateforme →
            </a>
          </div>
          <div style="border-top:1px solid #eee;padding-top:16px;color:#aaa;font-size:12px;text-align:center">
            ANAPEC — Agence Nationale de Promotion de l'Emploi et des Compétences
          </div>
        </div>
      `,
    });
  }

  async sendCertificateIssued(firstName: string, email: string, language: string, cefrLevel: string) {
    await this.send({
      to: email,
      subject: `🎓 Votre certificat ${cefrLevel} en ${language} est disponible`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="background:#C9A84C;padding:24px;border-radius:12px;text-align:center">
            <h1 style="color:#fff;margin:0">🏅 Félicitations !</h1>
          </div>
          <div style="padding:32px 0">
            <h2 style="color:#1A5F7A">Bonjour ${firstName},</h2>
            <p style="color:#555;line-height:1.6">
              Votre certificat de niveau <strong>${cefrLevel}</strong> en <strong>${language}</strong> 
              a été émis avec succès.
            </p>
            <p style="color:#555;line-height:1.6">
              Ce certificat est conforme au Cadre Européen Commun de Référence pour les Langues (CECRL).
            </p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/certificates"
               style="display:inline-block;margin-top:24px;padding:14px 32px;background:#C9A84C;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold">
              Télécharger mon certificat →
            </a>
          </div>
        </div>
      `,
    });
  }

  async sendPasswordReset(email: string, resetToken: string) {
    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    await this.send({
      to: email,
      subject: 'Réinitialisation de votre mot de passe ANAPEC',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#1A5F7A">Réinitialisation du mot de passe</h2>
          <p style="color:#555">Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe (valable 1 heure) :</p>
          <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#1A5F7A;color:#fff;text-decoration:none;border-radius:8px">
            Réinitialiser mon mot de passe
          </a>
          <p style="color:#aaa;font-size:12px">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
      `,
    });
  }
}
