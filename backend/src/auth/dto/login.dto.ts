// ── dto/login.dto.ts ─────────────────────────────────────────────────────────
import { IsEmail, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ahmed@example.ma' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

// ── dto/refresh.dto.ts ───────────────────────────────────────────────────────
export class RefreshDto {
  @IsUUID()
  userId: string;

  @IsString()
  refreshToken: string;
}
