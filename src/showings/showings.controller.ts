import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateShowingDto } from './dto/create-showing.dto';
import { ShowingsQueryDto } from './dto/showings-query.dto';
import { SeatState, ShowingView } from './entities/showing.entity';
import { ShowingsService } from './showings.service';

@ApiTags('showings')
@Controller('showings')
export class ShowingsController {
  constructor(
    private readonly showingsService: ShowingsService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: ShowingView, description: 'Сеанс створено' })
  @ApiBadRequestResponse({
    description:
      'Фільм або зал не існує; startsAt не ISO 8601 або в минулому; price не ціле додатне',
  })
  create(@Body() dto: CreateShowingDto): ShowingView {
    return this.showingsService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    type: [ShowingView],
    description:
      'Розклад, відсортований за startsAt (за зростанням), при рівності — за id',
  })
  @ApiBadRequestResponse({
    description: 'date не у форматі YYYY-MM-DD або filmId не UUID',
  })
  findAll(@Query() query: ShowingsQueryDto): ShowingView[] {
    return this.showingsService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ShowingView })
  @ApiBadRequestResponse({ description: 'id не є UUID' })
  @ApiNotFoundResponse({ description: 'Сеанс не знайдено' })
  findOne(@Param('id', ParseUUIDPipe) id: string): ShowingView {
    return this.showingsService.findOneView(id);
  }

  @Get(':id/seats')
  @ApiOkResponse({
    type: [SeatState],
    description: 'Усі місця залу з позначкою зайнятості',
  })
  @ApiNotFoundResponse({ description: 'Сеанс не знайдено' })
  getSeats(@Param('id', ParseUUIDPipe) id: string): SeatState[] {
    return this.bookingsService.getSeatMap(id);
  }
}
