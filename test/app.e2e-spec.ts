import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

const FUTURE = '2030-05-10';
const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Cinema booking API (e2e)', () => {
  let app: INestApplication<App>;
  let http: () => ReturnType<typeof request>;

  let filmId: string;
  let otherFilmId: string;
  let hallId: string;
  let showingA: string;
  let showingB: string;
  let showingC: string;
  let bookingId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    http = () => request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('films', () => {
    it('POST /films creates a film', async () => {
      const res = await http()
        .post('/films')
        .send({ title: 'Dune', durationMinutes: 166, releaseYear: 2024 })
        .expect(201);
      expect(res.body).toMatchObject({ title: 'Dune', durationMinutes: 166 });
      filmId = res.body.id;

      const other = await http()
        .post('/films')
        .send({ title: 'Arrival', durationMinutes: 116, releaseYear: 2016 })
        .expect(201);
      otherFilmId = other.body.id;
    });

    it('POST /films -> 400 on missing field / wrong type', async () => {
      await http()
        .post('/films')
        .send({ title: 'X', durationMinutes: 90 })
        .expect(400);
      await http()
        .post('/films')
        .send({ title: 'X', durationMinutes: '90', releaseYear: 2020 })
        .expect(400);
    });

    it('POST /films strips unknown fields', async () => {
      const res = await http()
        .post('/films')
        .send({
          title: 'Temp',
          durationMinutes: 90,
          releaseYear: 2020,
          hacked: true,
        })
        .expect(201);
      expect(res.body.hacked).toBeUndefined();
      await http().delete(`/films/${res.body.id}`).expect(204);
    });

    it('GET /films, GET /films/:id, 404', async () => {
      const list = await http().get('/films').expect(200);
      expect(list.body).toHaveLength(2);
      await http().get(`/films/${filmId}`).expect(200);
      await http().get(`/films/${MISSING_ID}`).expect(404);
    });

    it('PATCH /films/:id updates subset, 400 on type, 404', async () => {
      const res = await http()
        .patch(`/films/${filmId}`)
        .send({ title: 'Dune: Part Two' })
        .expect(200);
      expect(res.body).toMatchObject({
        title: 'Dune: Part Two',
        durationMinutes: 166,
      });
      await http()
        .patch(`/films/${filmId}`)
        .send({ releaseYear: 'soon' })
        .expect(400);
      await http()
        .patch(`/films/${MISSING_ID}`)
        .send({ title: 'X' })
        .expect(404);
    });
  });

  describe('halls', () => {
    it('POST /halls creates a hall, 409 on duplicate name, 400 on non-positive', async () => {
      const res = await http()
        .post('/halls')
        .send({ name: 'Red', rows: 3, seatsPerRow: 5 })
        .expect(201);
      hallId = res.body.id;
      await http()
        .post('/halls')
        .send({ name: 'red', rows: 2, seatsPerRow: 2 })
        .expect(409);
      await http()
        .post('/halls')
        .send({ name: 'Blue', rows: 0, seatsPerRow: 2 })
        .expect(400);
      await http()
        .post('/halls')
        .send({ name: 'Blue', rows: 2.5, seatsPerRow: 2 })
        .expect(400);
      await http().post('/halls').send({ rows: 2, seatsPerRow: 2 }).expect(400);
    });

    it('GET /halls/:id returns rows × seatsPerRow seats', async () => {
      const res = await http().get(`/halls/${hallId}`).expect(200);
      expect(res.body.seats).toHaveLength(15);
      expect(res.body.seats[0]).toEqual({ row: 1, seat: 1 });
      expect(res.body.seats[14]).toEqual({ row: 3, seat: 5 });
      await http().get(`/halls/${MISSING_ID}`).expect(404);
      await http().get('/halls').expect(200);
    });
  });

  describe('showings', () => {
    it('POST /showings creates showings with film title and hall name', async () => {
      const a = await http()
        .post('/showings')
        .send({ filmId, hallId, startsAt: `${FUTURE}T18:00:00Z`, price: 12500 })
        .expect(201);
      expect(a.body.film).toEqual({ id: filmId, title: 'Dune: Part Two' });
      expect(a.body.hall).toEqual({ id: hallId, name: 'Red' });
      showingA = a.body.id;

      const b = await http()
        .post('/showings')
        .send({
          filmId: otherFilmId,
          hallId,
          startsAt: `${FUTURE}T12:00:00Z`,
          price: 10000,
        })
        .expect(201);
      showingB = b.body.id;

      const c = await http()
        .post('/showings')
        .send({ filmId, hallId, startsAt: '2030-05-11T10:00:00Z', price: 9000 })
        .expect(201);
      showingC = c.body.id;
    });

    it('POST /showings -> 400 for missing film/hall, past or invalid date, bad price', async () => {
      const base = {
        filmId,
        hallId,
        startsAt: `${FUTURE}T18:00:00Z`,
        price: 100,
      };
      const missingFilm = await http()
        .post('/showings')
        .send({ ...base, filmId: MISSING_ID })
        .expect(400);
      expect(missingFilm.body.message).toContain('Film');
      const missingHall = await http()
        .post('/showings')
        .send({ ...base, hallId: MISSING_ID })
        .expect(400);
      expect(missingHall.body.message).toContain('Hall');
      await http()
        .post('/showings')
        .send({ ...base, startsAt: '2020-01-01T10:00:00Z' })
        .expect(400);
      await http()
        .post('/showings')
        .send({ ...base, startsAt: 'tomorrow' })
        .expect(400);
      await http()
        .post('/showings')
        .send({ ...base, price: 0 })
        .expect(400);
      await http()
        .post('/showings')
        .send({ ...base, price: 99.5 })
        .expect(400);
    });

    it('GET /showings filters by filmId and date and sorts by startsAt', async () => {
      const all = await http().get('/showings').expect(200);
      expect(all.body.map((s: { id: string }) => s.id)).toEqual([
        showingB,
        showingA,
        showingC,
      ]);

      const byFilm = await http().get(`/showings?filmId=${filmId}`).expect(200);
      expect(byFilm.body.map((s: { id: string }) => s.id)).toEqual([
        showingA,
        showingC,
      ]);

      const byDate = await http().get(`/showings?date=${FUTURE}`).expect(200);
      expect(byDate.body.map((s: { id: string }) => s.id)).toEqual([
        showingB,
        showingA,
      ]);

      const both = await http()
        .get(`/showings?filmId=${filmId}&date=${FUTURE}`)
        .expect(200);
      expect(both.body.map((s: { id: string }) => s.id)).toEqual([showingA]);

      await http().get('/showings?date=10-05-2030').expect(400);
      await http().get('/showings?date=2030-02-30').expect(400);
    });

    it('GET /showings/:id and /seats', async () => {
      const one = await http().get(`/showings/${showingA}`).expect(200);
      expect(one.body.film.title).toBe('Dune: Part Two');
      const seats = await http().get(`/showings/${showingA}/seats`).expect(200);
      expect(seats.body).toHaveLength(15);
      expect(seats.body.every((s: { isBooked: boolean }) => !s.isBooked)).toBe(
        true,
      );
      await http().get(`/showings/${MISSING_ID}`).expect(404);
      await http().get(`/showings/${MISSING_ID}/seats`).expect(404);
    });
  });

  describe('bookings', () => {
    it('POST /showings/:id/bookings books seats with total price', async () => {
      const res = await http()
        .post(`/showings/${showingA}/bookings`)
        .send({
          seats: [
            { row: 2, seat: 3 },
            { row: 2, seat: 4 },
          ],
        })
        .expect(201);
      expect(res.body.totalPrice).toBe(25000);
      bookingId = res.body.id;

      const seats = await http().get(`/showings/${showingA}/seats`).expect(200);
      expect(
        seats.body.filter((s: { isBooked: boolean }) => s.isBooked),
      ).toHaveLength(2);
    });

    it('validation errors -> 400, missing showing -> 404', async () => {
      const url = `/showings/${showingA}/bookings`;
      await http().post(url).send({ seats: [] }).expect(400);
      await http()
        .post(url)
        .send({ seats: [{ row: 1 }] })
        .expect(400);
      await http()
        .post(url)
        .send({
          seats: [
            { row: 1, seat: 1 },
            { row: 1, seat: 1 },
          ],
        })
        .expect(400);
      await http()
        .post(url)
        .send({ seats: [{ row: 9, seat: 1 }] })
        .expect(400);
      await http()
        .post(url)
        .send({ seats: [{ row: 1, seat: 0 }] })
        .expect(400);
      await http()
        .post(url)
        .send({ seats: [{ row: 1.5, seat: 1 }] })
        .expect(400);
      await http()
        .post(`/showings/${MISSING_ID}/bookings`)
        .send({ seats: [{ row: 1, seat: 1 }] })
        .expect(404);
    });

    it('409 when any seat is taken, and nothing is booked partially', async () => {
      await http()
        .post(`/showings/${showingA}/bookings`)
        .send({
          seats: [
            { row: 1, seat: 1 },
            { row: 2, seat: 3 },
          ],
        })
        .expect(409);
      const seats = await http().get(`/showings/${showingA}/seats`).expect(200);
      const seat11 = seats.body.find(
        (s: { row: number; seat: number }) => s.row === 1 && s.seat === 1,
      );
      expect(seat11.isBooked).toBe(false);
    });

    it('lists bookings and cancels a booking, freeing its seats', async () => {
      const all = await http().get('/bookings').expect(200);
      expect(all.body).toHaveLength(1);
      const byShowing = await http()
        .get(`/showings/${showingA}/bookings`)
        .expect(200);
      expect(byShowing.body).toHaveLength(1);
      await http().get(`/showings/${MISSING_ID}/bookings`).expect(404);

      await http().delete(`/bookings/${bookingId}`).expect(204);
      await http().delete(`/bookings/${bookingId}`).expect(404);
      const seats = await http().get(`/showings/${showingA}/seats`).expect(200);
      expect(seats.body.some((s: { isBooked: boolean }) => s.isBooked)).toBe(
        false,
      );
    });
  });

  describe('deletion rules', () => {
    it('cannot delete film or hall with showings (409), 404 for missing', async () => {
      await http().delete(`/films/${filmId}`).expect(409);
      await http().delete(`/halls/${hallId}`).expect(409);
      await http().delete(`/films/${MISSING_ID}`).expect(404);
      await http().delete(`/halls/${MISSING_ID}`).expect(404);
    });

    it('can delete a hall without showings', async () => {
      const hall = await http()
        .post('/halls')
        .send({ name: 'Empty', rows: 1, seatsPerRow: 1 })
        .expect(201);
      await http().delete(`/halls/${hall.body.id}`).expect(204);
    });
  });

  it('Swagger is served on /docs', async () => {
    await http().get('/docs').expect(200);
  });
});
