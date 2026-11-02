import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID, Matches } from 'class-validator';

export class ShowingsQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Лише сеанси цього фільму',
  })
  @IsOptional()
  @IsUUID()
  filmId?: string;

  @ApiPropertyOptional({
    example: '2026-12-01',
    description: 'Лише сеанси, що починаються в цю добу (YYYY-MM-DD, UTC)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  @IsISO8601(
    { strict: true },
    { message: 'date must be a valid calendar date' },
  )
  date?: string;
}
