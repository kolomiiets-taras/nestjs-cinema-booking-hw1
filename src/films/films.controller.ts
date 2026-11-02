import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film } from './entities/film.entity';
import { FilmsService } from './films.service';

@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Post()
  @ApiCreatedResponse({ type: Film, description: 'Фільм створено' })
  @ApiBadRequestResponse({
    description: 'Поле відсутнє або має неправильний тип',
  })
  create(@Body() dto: CreateFilmDto): Film {
    return this.filmsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [Film] })
  findAll(): Film[] {
    return this.filmsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: Film })
  @ApiBadRequestResponse({ description: 'id не є UUID' })
  @ApiNotFoundResponse({ description: 'Фільм не знайдено' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Film {
    return this.filmsService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: Film, description: 'Оновлений фільм' })
  @ApiBadRequestResponse({ description: 'Поле має неправильний тип' })
  @ApiNotFoundResponse({ description: 'Фільм не знайдено' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFilmDto,
  ): Film {
    return this.filmsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Фільм видалено' })
  @ApiNotFoundResponse({ description: 'Фільм не знайдено' })
  @ApiConflictResponse({ description: 'Для фільму існують сеанси' })
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.filmsService.remove(id);
  }
}
