import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './entities/booking.entity';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOkResponse({ type: [Booking], description: 'Усі бронювання' })
  findAll(): Booking[] {
    return this.bookingsService.findAll();
  }

  @Post('showings/:id/bookings')
  @ApiCreatedResponse({ type: Booking, description: 'Бронювання створено' })
  @ApiBadRequestResponse({
    description:
      'Масив місць порожній, елемент без row/seat, місце повторюється або не існує в залі',
  })
  @ApiNotFoundResponse({ description: 'Сеанс не знайдено' })
  @ApiConflictResponse({
    description: 'Хоча б одне місце вже зайняте — не бронюється жодне',
  })
  create(
    @Param('id', ParseUUIDPipe) showingId: string,
    @Body() dto: CreateBookingDto,
  ): Booking {
    return this.bookingsService.create(showingId, dto);
  }

  @Get('showings/:id/bookings')
  @ApiOkResponse({ type: [Booking], description: 'Бронювання сеансу' })
  @ApiNotFoundResponse({ description: 'Сеанс не знайдено' })
  findByShowing(@Param('id', ParseUUIDPipe) showingId: string): Booking[] {
    return this.bookingsService.findByShowing(showingId);
  }

  @Delete('bookings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Бронювання скасовано, місця звільнено',
  })
  @ApiNotFoundResponse({ description: 'Бронювання не знайдено' })
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.bookingsService.remove(id);
  }
}
