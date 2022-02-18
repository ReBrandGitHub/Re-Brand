import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../roles/roles.decorator';
import { Role } from '../roles/role.enum';
import { AuthTokenGuard } from '../guards/auth.token.guard';
import { VerificationGuard } from '../guards/verification.guard';
import { GetUser } from '../users/user.decorator';
import { UserModel } from '../users/user.model';
import { Web3Service } from '../web3/web3.service';
import { MintWalletDto } from './dto/mint-wallet.dto';
import { NftService } from '../nft/nft.service';
import { IdDto } from './dto/id.dto';

@Controller('admin')
export class AdminController {
  constructor(private web3Service: Web3Service,
              private nftService: NftService) {
  }

  @Post('wallet/mint/change')
  @Roles(Role.Superadmin)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async changeMintWallet(@Body() dto: MintWalletDto, @GetUser() user: UserModel) {
    return await this.web3Service.setServiceAccount(dto.private_key);
  }

  @Post('wallet')
  @Roles(Role.Superadmin)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async getWallets(@GetUser() user: UserModel) {
    return await this.web3Service.getServiceWallets();
  }

  @Post('nft/requests/last')
  @Roles(Role.Superadmin, Role.Admin, Role.Moderator)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async getLastNftRequests(@Body('page') page: number, @GetUser() user: UserModel) {
    return await this.nftService.getLastNftRequests(typeof page === 'object' ? 1 : page ?? 1);
  }

  @Post('nft/requests/verif')
  @Roles(Role.Superadmin, Role.Admin, Role.Moderator)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async verifToken(@Body() dto: IdDto, @GetUser() user: UserModel) {
    return await this.nftService.verifToken(dto);
  }
}
