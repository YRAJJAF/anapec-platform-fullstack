import { IsString, IsUUID } from 'class-validator'; // <-- Ajoute cette ligne

export class RefreshDto {
  @IsUUID()
  userId: string;

  @IsString()
  refreshToken: string;
}