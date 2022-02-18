import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PrivateKeysModel } from './privateKeys.model';
import * as math from 'exact-math';
import { ValidationException } from '../exceptions/validation.exception';

const Web3 = require('web3');

@Injectable()
export class Web3Service implements OnModuleInit {
  constructor(@InjectModel(PrivateKeysModel) private keysRepository: typeof PrivateKeysModel) {
  }

  private web3;
  private keys: string[];


  private serviceAcc;
  public serviceAccAddress;
  private servicePrivate;

  private serviceContract;

  async onModuleInit() {
    if (!this.web3) {
      this.web3 = process.env.WEB3_PROVIDER.includes('https://') ? new Web3(process.env.WEB3_PROVIDER) : new Web3(new Web3.providers.WebsocketProvider(process.env.WEB3_PROVIDER, {
        clientConfig: {
          keepalive: true,
          keepaliveInterval: 60000,
        },
        reconnect: {
          auto: true,
          delay: 2500,
          onTimeout: true,
        },
      }));
    }
    this.keys = (await this.keysRepository.findAll({ attributes: ['private_key'] })).map((obj) => obj.private_key);
    this.serviceContract = new this.web3.eth.Contract(JSON.parse(process.env.SERVICE_CONTRACT_ABI), process.env.SERVICE_CONTRACT_ADDRESS);
  }

  validateService() {
    if (!this.serviceAcc) {
      throw new ValidationException([{
        field: 'service',
        errors: ['No mint account'],
      }]);
    }

    return;
  }

  async getServiceWallets() {
    this.validateService();
    const mint_wallet = this.serviceAcc.address;
    const collector_wallet = this.serviceAcc.address;
    return {
      mint_wallet,
      collector_wallet,
    };
  }

  async setServiceAccount(private_key: string) {
    if (this.serviceAcc) {
      throw new ValidationException([{
        field: 'service',
        errors: ['Account already set'],
      }]);
    }

    try {
      const acc = await this.web3.eth.accounts.privateKeyToAccount(private_key);
      const owner = await this.serviceContract.methods.owner().call();
      if (!acc || acc.address !== owner) {
        throw new ValidationException([{
          field: 'account',
          errors: ['You must be owner of contract'],
        }]);
      }
      this.serviceAcc = acc;
      this.serviceAccAddress = acc.address;
      this.servicePrivate = private_key;
      // this.web3.eth.defaultAccount = this.serviceAcc.address
      return;
    } catch (e) {
      throw new ValidationException([{
        field: 'service',
        errors: ['Invalid account or other problem'],
      }]);
    }

  }


  async startListenerTransfer() {
    this.serviceContract.events.TransferSingle({}).on('data', function(event) {
      console.log(event);
    });
  }

  async createAccount(): Promise<string> {
    const account = this.web3.eth.accounts.create();
    await this.keysRepository.create({ address: account.address, private_key: account.privateKey });
    return account.address;
  }

  async getBalance(address): Promise<number> {
    const balance = await this.web3.eth.getBalance(address);
    console.log(balance);
    return balance;
  }

  async findWallet(address): Promise<string> {
    return (await this.keysRepository.findOne({ where: { address }, attributes: ['address'] }))?.address;
  }

  toEther(value: number | string) {
    if (typeof value === 'string') {
      return this.web3.utils.fromWei(value, 'ether');
    } else {
      return this.web3.utils.fromWei(value.toString(), 'ether');
    }
  }

  toWei(value: number | string) {
    if (typeof value === 'string') {
      return this.web3.utils.toWei(value, 'ether');
    } else {
      return this.web3.utils.toWei(value.toString(), 'ether');
    }
  }

  async signTransaction(tx, wallet, privateKey, to, value?) {
    const nonce = await this.web3.eth.getTransactionCount(wallet.address);
    const gas = await tx.estimateGas({ from: wallet.address });
    const gasPrice = await this.web3.eth.getGasPrice();
    const data = tx.encodeABI();
    return await wallet.signTransaction({ to: to, data, gas, gasPrice, nonce, value }, () => {
    }, privateKey);
  }

  async getNftBalances(address: string, ids: number[]) {
    const addresses = [];
    ids.forEach(() => addresses.push(address));
    const res = await this.serviceContract.methods.balanceOfBatch(addresses, ids).call();
    const obj = {};
    for (let i = 0; i < ids.length; i++) {
      obj[ids[i]] = res[i];
    }
    return obj;
  }

  async getNftBalance(address: string, id: number) {
    const res = await this.serviceContract.methods.balanceOf(address, id).call();
    return res;
  }

  async transferTo(from, to, value: string): Promise<number> {
    const key = (await this.keysRepository.findOne({
      where: { address: from },
      attributes: ['private_key'],
    })).private_key;
    const user_wallet = await this.web3.eth.accounts.privateKeyToAccount(key);
    const nonce = await this.web3.eth.getTransactionCount(user_wallet.address);
    const gas = await this.web3.eth.estimateGas({
      from: user_wallet.address,
      to,
      nonce,
      value,
    });
    const gasPrice = await this.web3.eth.getGasPrice();

    const signed = await user_wallet.signTransaction({
      to,
      nonce,
      value,
      gas,
      gasPrice,
    }, () => {
    }, key);
    const res = await this.web3.eth.sendSignedTransaction(signed.rawTransaction);

    return res;
  }

  // async buyNftToken(seller: string, to: string, id: number, amount: number) {
  //   const key_to = (await this.keysRepository.findOne({ where: { address: to }, attributes: ['private_key'] })).private_key;
  //   const to_wallet = await this.web3.eth.accounts.privateKeyToAccount(key_to);
  //   const price = (await this.getTokenListing(seller, id)).price * amount
  //
  //
  //   const tx = this.sellContract.methods.purchase(seller, id, amount);
  //   const signedTx = await this.signTransaction(tx, to_wallet, key_to, this.sellContract.options.address, price.toString())
  //   return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  // }

  async getCostOfMintNft(id: number, emission: number, address: string) {
    this.validateService();
    const tx = this.serviceContract.methods.mint(address, id, emission);
    const gas = await tx.estimateGas({ from: this.serviceAcc.address });
    const gasPrice = await this.web3.eth.getGasPrice();

    return (gas * gasPrice).toString();
  }

  async getCostOfMintBatchNft(ids: number[], emissions: number[], address: string) {
    this.validateService();
    const tx = this.serviceContract.methods.mintBatch(address, ids, emissions);
    const gas = await tx.estimateGas({ from: this.serviceAcc.address });
    const gasPrice = await this.web3.eth.getGasPrice();

    return (gas * gasPrice).toString();
  }

  async mintNft(id: number, emission: number, address: string) {
    this.validateService();
    const tx = this.serviceContract.methods.mint(address, id, emission);
    const signedTx = await this.signTransaction(tx, this.serviceAcc, this.servicePrivate, this.serviceContract.options.address, '');

    const res = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return res;
  }

  async mintBatchNft(ids: number[], emissions: number[], address: string) {
    this.validateService();
    const tx = this.serviceContract.methods.mintBatch(address, ids, emissions);
    const signedTx = await this.signTransaction(tx, this.serviceAcc, this.servicePrivate, this.serviceContract.options.address, '');

    const res = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return res;
  }


  async checkForSendAmount(address, payment_amount): Promise<any> {
    const payment_amount_network = payment_amount * 1000000000000000000;
    const start_amount = await this.getBalance(address);
    let interval = null;
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
      }
    }, 600000);
    const result = await new Promise((resolve, reject) => {
      interval = setInterval(async () => {
        //TODO: Запросы к bscscan
        const amount = await this.getBalance(address);
        console.log(amount);
        if (math.sub(amount.toString(), start_amount.toString()) >= payment_amount_network) {
          resolve({ amount });
        }
      }, 10000);
    });
    clearInterval(interval);
    return result;
  }

  async getBalanceERC20(wallet: string, CONTRACT_ADDRESS: string, CONTRACT_ABI: object) {
    const contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    const res = await contract.methods.balanceOf(wallet).call();
    console.log(res);
    return res;
  }

  async transferTokenTo(from: string, to: string, id: number, amount: number) {
    this.validateService();
    const private_key = (await this.keysRepository.findOne({
      where: { address: from },
      attributes: ['private_key'],
    }))?.private_key;
    if (!private_key) {
      throw new ValidationException([{
        field: 'wallet',
        errors: ['Invalid wallet'],
      }]);
    }
    const acc = await this.web3.eth.accounts.privateKeyToAccount(private_key);
    const tx = this.serviceContract.methods.safeTransferFrom(from, to, id, amount);
    const signedTx = await this.signTransaction(tx, acc, private_key, this.serviceContract.options.address, '');

    return await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  }

  async transferTokenToPrice(from: string, to: string, id: number, amount: number) {
    this.validateService();
    const tx = this.serviceContract.methods.safeTransferFrom(from, to, id, amount);
    const gas = await tx.estimateGas({ from });
    const gasPrice = await this.web3.eth.getGasPrice();

    return (gas * gasPrice).toString();
  }

  async validateWallet(wallet: string) {
    const status = this.web3.utils.isAddress(wallet);
    if (!status) {
      throw new ValidationException([{
        field: 'wallet',
        errors: ['Invalid wallet address'],
      }]);
    }
    return status;
  }

  async getCostOfTransfer(from: string, to: string, value: string) {
    const key = (await this.keysRepository.findOne({
      where: { address: from },
      attributes: ['private_key'],
    })).private_key;
    const user_wallet = await this.web3.eth.accounts.privateKeyToAccount(key);
    const nonce = await this.web3.eth.getTransactionCount(user_wallet.address);
    const gasPrice = await this.web3.eth.getGasPrice();
    const gas = await this.web3.eth.estimateGas({
      from: user_wallet.address,
      to,
      nonce,
      value,
    });
    return (gas * gasPrice).toString();
  }
}
