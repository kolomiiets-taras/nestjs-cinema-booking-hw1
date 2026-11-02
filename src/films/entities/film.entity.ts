import { ApiProperty } from '@nestjs/swagger';

export class Film {
  @ApiProperty({
    format: 'uuid',
    example: '3f1c2b0e-7a52-4d7e-9b8a-0c8f2e6d1a11',
  })
  id: string;

  @ApiProperty({ example: 'Dune: Part Two' })
  title: string;

  @ApiProperty({ example: 166, description: 'Тривалість у хвилинах' })
  durationMinutes: number;

  @ApiProperty({ example: 2024 })
  releaseYear: number;
}
