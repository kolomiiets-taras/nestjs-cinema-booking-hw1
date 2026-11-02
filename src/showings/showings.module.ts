import { Module, forwardRef } from '@nestjs/common';
import { FilmsModule } from '../films/films.module';
import { HallsModule } from '../halls/halls.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ShowingsController } from './showings.controller';
import { ShowingsService } from './showings.service';

@Module({
  imports: [forwardRef(() => FilmsModule), forwardRef(() => HallsModule)],
  controllers: [ShowingsController, BookingsController],
  providers: [ShowingsService, BookingsService],
  exports: [ShowingsService],
})
export class ShowingsModule {}
