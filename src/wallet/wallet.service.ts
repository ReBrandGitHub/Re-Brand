import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { Web3Service } from '../web3/web3.service';
import { Cache } from 'cache-manager';
import { validateWalletsChoiceType, WithdrawMoneyDto } from './dto/withdraw-money.dto';
import { ValidationException } from '../exceptions/validation.exception';
import wallets_contracts from '../wallets_contracts';

@Injectable()
export class WalletService {
  constructor(private usersService: UsersService,
              private web3Service: Web3Service,
              @Inject(CACHE_MANAGER) private cacheManager: Cache) {
  }

  async withdraw(dto: WithdrawMoneyDto, user_id: number) {
    if (!validateWalletsChoiceType(dto.currency)) throw new ValidationException([{
      field: 'currency',
      errors: ['Field currency must be only \'bsc\', \'busd\'']
    }])
    await this.web3Service.validateWallet(dto.wallet)
    const user = await this.usersService.getUserById(user_id)
    if (wallets_contracts[dto.currency].network) {
      if (user.wallet_amounts[dto.currency].wallet_amount < dto.amount) throw new ValidationException([{
        field: 'amount',
        errors: ['You have not enough money']
      }])
      const cost = parseFloat(this.web3Service.toEther(await this.web3Service.getCostOfTransfer(user.wallet, dto.wallet, this.web3Service.toWei(dto.amount))))
      if (user.wallet_amounts[dto.currency].wallet_amount < dto.amount + cost) throw new ValidationException([{
        field: 'amount',
        errors: ['You have not enough money to pay network fee']
      }])
      const res = await this.web3Service.transferTo(user.wallet, dto.wallet, this.web3Service.toWei(dto.amount))
      if (res) {
        await this.usersService.updateWalletState(user.id)
        return { success: true }
      }
    } else {
      // this.web3Service.trans
    }

  }
}
