import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { RolesGuard } from './roles/roles.guard';
import { runInCluster } from './utils/runInCluster';
import { ValidationPipe } from './pipes/validation.pipe';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.use(cookieParser())
  // app.useGlobalGuards(new RolesGuard(new Reflector()))
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? [''] : 'http://localhost:3000',
    credentials: true
  });
  await app.listen(5000);
}

runInCluster(bootstrap);
