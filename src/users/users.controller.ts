import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post, UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { EmailDto } from '../global_dto/email.dto';
import { UsersService } from './users.service';
import { VerifSubmitDto } from './dto/verif-submit.dto';
import { GetUser } from './user.decorator';
import { UserModel } from './user.model';
import { AuthTokenGuard } from '../guards/auth.token.guard';
import { Roles } from '../roles/roles.decorator';
import { Role } from '../roles/role.enum';
import { UserIdDto } from '../global_dto/user_id.dto';
import { ValidateFilePipe } from '../pipes/validate-file.pipe';
import { VerificationGuard } from '../guards/verification.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ValidationException } from '../exceptions/validation.exception';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ValidateImagePipe } from '../pipes/validate-image.pipe';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {
  }

  @Post('email/verif')
  async verifEmailStart(@Body() dto: EmailDto) {
    return await this.usersService.verifEmailStart(dto)
  }

  @Post('email/verif/submit')
  async verifEmailSubmit(@Body() dto: VerifSubmitDto) {
    return await this.usersService.verifEmailSubmit(dto)
  }

  @Post('wallet/update')
  @Roles(Role.Admin, Role.User, Role.Superadmin, Role.Moderator)
  @UseGuards(AuthTokenGuard)
  async updateWalletState(@GetUser() user: UserModel) {
    return await this.usersService.updateWalletState(user.id)
  }

  @Post('data')
  @Roles(Role.Admin, Role.User, Role.Superadmin, Role.Moderator)
  @UseGuards(AuthTokenGuard)
  async getUserData(@GetUser() user: UserModel) {
    return (await this.usersService.getUserById(user.id)).getPublicData()
  }

  @Post('seal/upload')
  @Roles(Role.Admin, Role.User, Role.Superadmin, Role.Moderator)
  @UsePipes(ValidateFilePipe)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadSeal(@UploadedFile('file') file, @GetUser() user: UserModel) {
    if (!file) throw new ValidationException([{
      field: 'file',
      errors: ['You must put files to upload seal']
    }])
    return await this.usersService.uploadSeal(user.id, file)
  }

  @Post('seal')
  @Roles(Role.Admin, Role.User, Role.Superadmin, Role.Moderator)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async getSeals(@GetUser() user: UserModel) {
    return await this.usersService.getSeals(user.id)
  }

  @Post('profile/update')
  @Roles(Role.Admin, Role.User, Role.Superadmin, Role.Moderator)
  @UsePipes(ValidateImagePipe)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfileData(@UploadedFile() file, @Body() dto: UpdateProfileDto, @GetUser() user: UserModel) {
    return await this.usersService.updateProfileData(dto, user.id, file)
  }

  @Post('reset-password')
  @Roles(Role.Admin, Role.User, Role.Superadmin, Role.Moderator)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async changePassword(@GetUser() user: UserModel) {
    return await this.usersService.resetPassword(user.id)
  }

  @Post('reset-password/submit')
  @Roles(Role.Admin, Role.User, Role.Superadmin, Role.Moderator)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async submitPassword(@Body() dto: ResetPasswordDto, @GetUser() user: UserModel) {
    return await this.usersService.newPassword(dto, user.id)
  }
}
