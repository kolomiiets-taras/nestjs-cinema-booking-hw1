import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Seat } from '../halls/entities/hall.entity';
import { HallsService } from '../halls/halls.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './entities/booking.entity';
import { SeatState } from './entities/showing.entity';
import { ShowingsService } from './showings.service';

const seatKey = ({ row, seat }: Seat): string => `${row}:${seat}`;

@Injectable()
export class BookingsService {
  private readonly bookings: Booking[] = [];

  constructor(
    private readonly showingsService: ShowingsService,
    @Inject(forwardRef(() => HallsService))
    private readonly hallsService: HallsService,
  ) {}

  create(showingId: string, dto: CreateBookingDto): Booking {
    const showing = this.showingsService.findOne(showingId);
    const hall = this.hallsService.findOne(showing.hallId);

    const outside = dto.seats.filter(
      (seat) => !this.hallsService.hasSeat(hall, seat),
    );
    if (outside.length > 0) {
      throw new BadRequestException(
        `Seats do not exist in hall "${hall.name}" (${hall.rows} rows × ${hall.seatsPerRow} seats): ` +
          outside.map(seatKey).join(', '),
      );
    }

    // All seats are checked before anything is written: either every seat is booked or none.
    const booked = this.bookedSeatKeys(showingId);
    const taken = dto.seats.filter((seat) => booked.has(seatKey(seat)));
    if (taken.length > 0) {
      throw new ConflictException(
        `Seats are already booked: ${taken.map(seatKey).join(', ')}`,
      );
    }

    const booking: Booking = {
      id: randomUUID(),
      showingId,
      seats: dto.seats.map(({ row, seat }) => ({ row, seat })),
      totalPrice: showing.price * dto.seats.length,
      createdAt: new Date().toISOString(),
    };
    this.bookings.push(booking);
    return booking;
  }

  findAll(): Booking[] {
    return this.bookings;
  }

  findByShowing(showingId: string): Booking[] {
    this.showingsService.findOne(showingId);
    return this.bookings.filter((booking) => booking.showingId === showingId);
  }

  getSeatMap(showingId: string): SeatState[] {
    const showing = this.showingsService.findOne(showingId);
    const hall = this.hallsService.findOne(showing.hallId);
    const booked = this.bookedSeatKeys(showingId);
    return this.hallsService
      .getSeats(hall)
      .map((seat) => ({ ...seat, isBooked: booked.has(seatKey(seat)) }));
  }

  remove(id: string): void {
    const index = this.bookings.findIndex((booking) => booking.id === id);
    if (index === -1) {
      throw new NotFoundException(`Booking with id "${id}" not found`);
    }
    this.bookings.splice(index, 1);
  }

  private bookedSeatKeys(showingId: string): Set<string> {
    return new Set(
      this.bookings
        .filter((booking) => booking.showingId === showingId)
        .flatMap((booking) => booking.seats.map(seatKey)),
    );
  }
}
