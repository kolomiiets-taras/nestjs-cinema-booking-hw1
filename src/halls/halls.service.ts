import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ShowingsService } from '../showings/showings.service';
import { CreateHallDto } from './dto/create-hall.dto';
import { Hall, HallWithSeats, Seat } from './entities/hall.entity';

@Injectable()
export class HallsService {
  private readonly halls: Hall[] = [];

  constructor(
    // Showings depend on halls (existence, names, seat layout), and deleting a hall depends on showings.
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  create(dto: CreateHallDto): Hall {
    const name = dto.name.trim();
    const duplicate = this.halls.some(
      (hall) => hall.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      throw new ConflictException(`Hall with name "${name}" already exists`);
    }
    const hall: Hall = {
      id: randomUUID(),
      name,
      rows: dto.rows,
      seatsPerRow: dto.seatsPerRow,
    };
    this.halls.push(hall);
    return hall;
  }

  findAll(): Hall[] {
    return this.halls;
  }

  /** Returns the hall or undefined; used by other modules for domain checks. */
  find(id: string): Hall | undefined {
    return this.halls.find((hall) => hall.id === id);
  }

  findOne(id: string): Hall {
    const hall = this.find(id);
    if (!hall) {
      throw new NotFoundException(`Hall with id "${id}" not found`);
    }
    return hall;
  }

  findOneWithSeats(id: string): HallWithSeats {
    const hall = this.findOne(id);
    return { ...hall, seats: this.getSeats(hall) };
  }

  /** Seats are not stored: they are derived from rows × seatsPerRow. */
  getSeats(hall: Hall): Seat[] {
    const seats: Seat[] = [];
    for (let row = 1; row <= hall.rows; row++) {
      for (let seat = 1; seat <= hall.seatsPerRow; seat++) {
        seats.push({ row, seat });
      }
    }
    return seats;
  }

  hasSeat(hall: Hall, { row, seat }: Seat): boolean {
    return (
      row >= 1 && row <= hall.rows && seat >= 1 && seat <= hall.seatsPerRow
    );
  }

  remove(id: string): void {
    this.findOne(id);
    if (this.showingsService.existsForHall(id)) {
      throw new ConflictException(
        `Hall "${id}" cannot be deleted: it has scheduled showings`,
      );
    }
    const index = this.halls.findIndex((hall) => hall.id === id);
    this.halls.splice(index, 1);
  }
}
