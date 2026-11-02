import { ApiProperty } from '@nestjs/swagger';

export class Seat {
  @ApiProperty({ example: 1, description: 'Номер ряду (з 1)' })
  row: number;

  @ApiProperty({ example: 5, description: 'Номер місця в ряду (з 1)' })
  seat: number;
}

export class Hall {
  @ApiProperty({
    format: 'uuid',
    example: '9b2d7c1a-5e3f-4a8b-8c6d-2f1e0a9b7c55',
  })
  id: string;

  @ApiProperty({ example: 'Red Hall', description: 'Унікальна назва залу' })
  name: string;

  @ApiProperty({ example: 3 })
  rows: number;

  @ApiProperty({ example: 5 })
  seatsPerRow: number;
}

export class HallWithSeats extends Hall {
  @ApiProperty({
    type: [Seat],
    description: 'Усі місця залу: rows × seatsPerRow',
  })
  seats: Seat[];
}
