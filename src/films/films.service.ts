import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ShowingsService } from '../showings/showings.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film } from './entities/film.entity';

@Injectable()
export class FilmsService {
  private readonly films: Film[] = [];

  constructor(
    // Showings depend on films (existence, titles), and deleting a film depends on showings.
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  create(dto: CreateFilmDto): Film {
    const film: Film = { id: randomUUID(), ...dto };
    this.films.push(film);
    return film;
  }

  findAll(): Film[] {
    return this.films;
  }

  /** Returns the film or undefined; used by other modules for domain checks. */
  find(id: string): Film | undefined {
    return this.films.find((film) => film.id === id);
  }

  findOne(id: string): Film {
    const film = this.find(id);
    if (!film) {
      throw new NotFoundException(`Film with id "${id}" not found`);
    }
    return film;
  }

  update(id: string, dto: UpdateFilmDto): Film {
    const film = this.findOne(id);
    Object.assign(film, dto);
    return film;
  }

  remove(id: string): void {
    this.findOne(id);
    if (this.showingsService.existsForFilm(id)) {
      throw new ConflictException(
        `Film "${id}" cannot be deleted: it has scheduled showings`,
      );
    }
    const index = this.films.findIndex((film) => film.id === id);
    this.films.splice(index, 1);
  }
}
