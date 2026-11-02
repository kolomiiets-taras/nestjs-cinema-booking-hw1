import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const port = app.get(ConfigService).get<number>('PORT', 3000);
  await app.listen(port);
  console.log(
    `Server: http://localhost:${port}, Swagger: http://localhost:${port}/docs`,
  );
}
void bootstrap();
