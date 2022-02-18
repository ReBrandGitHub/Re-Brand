import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer, WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { Web3Service } from '../web3/web3.service';
import { GetWalletDto } from './dto/get-wallet.dto';
import { CACHE_MANAGER, Inject, UseGuards, UsePipes } from '@nestjs/common';
import { ValidationWsPipe } from '../pipes/validation.ws.pipe';
import { Cache } from 'cache-manager';
import * as math from 'exact-math';
import { AuthTokenWsGuard } from '../guards/auth.token-ws.guard';
import { GetUser } from '../users/user.decorator';
import { UserModel } from '../users/user.model';

@WebSocketGateway({ namespace: 'wallet-send' })
export class WalletGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(private usersService: UsersService,
              private web3Service: Web3Service,
              @Inject(CACHE_MANAGER) private cacheManager: Cache) {
  }

  @WebSocketServer()
  server: Server

  // @UseGuards(AuthTokenWsGuard)
  @UsePipes(new ValidationWsPipe())
  @SubscribeMessage('wallet')
  async getWallet(client: Socket, payload: GetWalletDto) {
    console.log(payload);
    const wallet = await this.web3Service.findWallet(payload.address)
    if (!wallet) throw new WsException('Invalid address')

    // await this.cacheManager.set(`send-wallet:${ wallet }`, true)

    this.awaitPayment(wallet, payload.payment_amount, client)

    return { event: 'received', data: { wallet, amount: payload.payment_amount } }
  }

  private async awaitPayment(wallet, amount, client: Socket) {
    const payment = math.div((await this.web3Service.checkForSendAmount(wallet, amount)).amount, '1000000000000000000')
    const user = await this.usersService.getUserByWallet(wallet)
    user.wallet_amounts = {
      ...user.wallet_amounts,
      bsc: {
        wallet_amount: payment
      }
    }
    await user.save()
    this.server.emit('receivedPayment', { amount: payment })
    client.client._disconnect()
  }

  afterInit(server: Server) {
    console.log('Init');
  }


  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
    console.log(`${args}`);
  }
}
