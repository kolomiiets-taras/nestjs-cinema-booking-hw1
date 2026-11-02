import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateHallDto {
  @ApiProperty({
    example: 'Red Hall',
    description: 'Назва залу, має бути унікальною',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 3,
    description: 'Кількість рядів, ціле додатне число',
  })
  @IsInt()
  @IsPositive()
  rows: number;

  @ApiProperty({
    example: 5,
    description: 'Кількість місць у ряду, ціле додатне число',
  })
  @IsInt()
  @IsPositive()
  seatsPerRow: number;
}
