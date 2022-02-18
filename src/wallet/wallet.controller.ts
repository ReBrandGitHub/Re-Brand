import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Roles } from '../roles/roles.decorator';
import { Role } from '../roles/role.enum';
import { AuthTokenGuard } from '../guards/auth.token.guard';
import { VerificationGuard } from '../guards/verification.guard';
import { WithdrawMoneyDto } from './dto/withdraw-money.dto';
import { GetUser } from '../users/user.decorator';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {
  }

  @Post('withdraw')
  @Roles(Role.User, Role.Moderator, Role.Admin, Role.Superadmin)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async witdraw(@Body() dto: WithdrawMoneyDto, @GetUser() user) {
    return this.walletService.withdraw(dto, user.id)
  }
}
