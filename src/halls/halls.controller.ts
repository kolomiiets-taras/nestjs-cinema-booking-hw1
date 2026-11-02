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
import { CreateHallDto } from './dto/create-hall.dto';
import { Hall, HallWithSeats } from './entities/hall.entity';
import { HallsService } from './halls.service';

@ApiTags('halls')
@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Post()
  @ApiCreatedResponse({ type: Hall, description: 'Зал створено' })
  @ApiBadRequestResponse({
    description: 'Поле відсутнє, має неправильний тип або не є цілим додатним',
  })
  @ApiConflictResponse({ description: 'Зал з такою назвою вже існує' })
  create(@Body() dto: CreateHallDto): Hall {
    return this.hallsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [Hall] })
  findAll(): Hall[] {
    return this.hallsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({
    type: HallWithSeats,
    description: 'Зал з переліком усіх місць',
  })
  @ApiBadRequestResponse({ description: 'id не є UUID' })
  @ApiNotFoundResponse({ description: 'Зал не знайдено' })
  findOne(@Param('id', ParseUUIDPipe) id: string): HallWithSeats {
    return this.hallsService.findOneWithSeats(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Зал видалено' })
  @ApiNotFoundResponse({ description: 'Зал не знайдено' })
  @ApiConflictResponse({ description: 'У залі є сеанси' })
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.hallsService.remove(id);
  }
}
