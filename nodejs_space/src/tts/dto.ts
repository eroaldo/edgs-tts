import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export const SUPPORTED_FORMATS = ['mp3', 'opus'] as const;
export type AudioFormat = typeof SUPPORTED_FORMATS[number];

export class SynthesizeDto {
  @ApiProperty({ description: 'Text to synthesize', example: 'Olá, isto é um teste de áudio.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  text!: string;

  @ApiPropertyOptional({ description: 'Voice ShortName (e.g. pt-BR-FranciscaNeural)', default: 'pt-BR-FranciscaNeural' })
  @IsOptional()
  @IsString()
  voice?: string;

  @ApiPropertyOptional({ description: 'Output format', enum: SUPPORTED_FORMATS, default: 'mp3' })
  @IsOptional()
  @IsIn(SUPPORTED_FORMATS as unknown as string[])
  format?: AudioFormat;

  @ApiPropertyOptional({ description: 'Speech rate, e.g. 1.0 = normal, 0.5–2.0', default: 1.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  rate?: number;

  @ApiPropertyOptional({ description: 'Pitch multiplier, 0.5–2.0', default: 1.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  pitch?: number;

  @ApiPropertyOptional({ description: 'Volume multiplier, 0–2.0', default: 1.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(2.0)
  volume?: number;
}

export class VoicesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by locale prefix, e.g. pt, pt-BR, en-US' })
  @IsOptional()
  @IsString()
  locale?: string;
}
