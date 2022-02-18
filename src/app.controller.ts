import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Roles } from './roles/roles.decorator';
import { Role } from './roles/role.enum';

@Controller()
export class AppController {
  constructor() {}
}
