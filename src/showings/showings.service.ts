import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FilmsService } from '../films/films.service';
import { HallsService } from '../halls/halls.service';
import { CreateShowingDto } from './dto/create-showing.dto';
import { ShowingsQueryDto } from './dto/showings-query.dto';
import { Showing, ShowingView } from './entities/showing.entity';

@Injectable()
export class ShowingsService {
  private readonly showings: Showing[] = [];

  constructor(
    @Inject(forwardRef(() => FilmsService))
    private readonly filmsService: FilmsService,
    @Inject(forwardRef(() => HallsService))
    private readonly hallsService: HallsService,
  ) {}

  create(dto: CreateShowingDto): ShowingView {
    // Referenced records that do not exist make the request itself invalid -> 400, not 404.
    if (!this.filmsService.find(dto.filmId)) {
      throw new BadRequestException(
        `Film with id "${dto.filmId}" does not exist`,
      );
    }
    if (!this.hallsService.find(dto.hallId)) {
      throw new BadRequestException(
        `Hall with id "${dto.hallId}" does not exist`,
      );
    }
    const startsAt = new Date(dto.startsAt);
    if (startsAt.getTime() <= Date.now()) {
      throw new BadRequestException('startsAt must be in the future');
    }

    const showing: Showing = {
      id: randomUUID(),
      filmId: dto.filmId,
      hallId: dto.hallId,
      startsAt: startsAt.toISOString(),
      price: dto.price,
    };
    this.showings.push(showing);
    return this.toView(showing);
  }

  findAll(query: ShowingsQueryDto): ShowingView[] {
    return this.showings
      .filter((showing) => !query.filmId || showing.filmId === query.filmId)
      .filter(
        (showing) =>
          !query.date || showing.startsAt.slice(0, 10) === query.date,
      )
      .sort(
        (a, b) =>
          a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id),
      )
      .map((showing) => this.toView(showing));
  }

  /** Raw stored showing; throws 404 when it does not exist. */
  findOne(id: string): Showing {
    const showing = this.showings.find((item) => item.id === id);
    if (!showing) {
      throw new NotFoundException(`Showing with id "${id}" not found`);
    }
    return showing;
  }

  findOneView(id: string): ShowingView {
    return this.toView(this.findOne(id));
  }

  existsForFilm(filmId: string): boolean {
    return this.showings.some((showing) => showing.filmId === filmId);
  }

  existsForHall(hallId: string): boolean {
    return this.showings.some((showing) => showing.hallId === hallId);
  }

  private toView(showing: Showing): ShowingView {
    const film = this.filmsService.findOne(showing.filmId);
    const hall = this.hallsService.findOne(showing.hallId);
    return {
      id: showing.id,
      film: { id: film.id, title: film.title },
      hall: { id: hall.id, name: hall.name },
      startsAt: showing.startsAt,
      price: showing.price,
    };
  }
}
