import { CACHE_MANAGER, Inject, Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { Cache } from 'cache-manager'
import { ValidationException } from '../exceptions/validation.exception';
import { UserModel, Wallets } from './user.model';
import { compare, genSalt, hash } from 'bcryptjs';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../roles/role.enum';
import { EmailDto } from '../global_dto/email.dto';
import { VerifSubmitDto } from './dto/verif-submit.dto';
import { CollectionModel } from '../nft/models/collection.model';
import { NftModel } from '../nft/models/nft.model';
import * as math from 'exact-math'
import { Web3Service } from '../web3/web3.service';
import { ConflictException } from '../exceptions/conflict.exception';
import wallets_contracts from '../wallets_contracts';
import { FilesService } from '../files/files.service';
import { SealModel } from './seal.model';
import { CategoryModel } from '../nft/models/category.model';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Op } from 'sequelize';
import { randomUUID } from 'crypto';
import { ForbiddenException } from '../exceptions/forbidden.exception';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache,
              private web3Service: Web3Service,
              private filesService: FilesService,
              @InjectModel(UserModel) private usersRepository: typeof UserModel,
              @InjectModel(SealModel) private sealsRepository: typeof SealModel) {
  }

  async onModuleInit() {
    const data: RegisterDto = JSON.parse(process.env.SUPERADMIN_DATA);
    const hashPassword = await hash(data.password, await genSalt(10));
    const created = await this.usersRepository.findOne({where: { email: data.email }})
    if (created) return

    const wallet = await this.web3Service.createAccount()
    const superadmin = await this.usersRepository.create({ ...data, password: hashPassword, role: Role.Superadmin, wallet, wallet_amounts: { bsc: { wallet_amount: 0 }, busd: { wallet_amount: 0 } }, verifiedKYC: true });
  }

  async createUser(dto: RegisterDto) {
    const created = await this.usersRepository.findOne({ where: { email: dto.email } })
    if (created) throw new ConflictException([{
      field: 'email',
      errors: ['User with this email already exist']
    }])
    const verifiedEmail = await this.cacheManager.get(`verif-email:${dto.email}`)
    if (!verifiedEmail) throw new ValidationException([{
      field: 'email',
      errors: ['Email did not verified']
    }])

    //СОЗДАНИЕ КОШЕЛЬКА
    const wallet = await this.web3Service.createAccount()
    const hashPassword = await hash(dto.password, await genSalt(10));
    const user = await this.usersRepository.create({ ...dto, password: hashPassword, role: Role.User, wallet, wallet_amounts: { bsc: { wallet_amount: 0 }, busd: { wallet_amount: 0 } }, verifiedKYC: false });
    await this.cacheManager.del(`verif-email:${user.email}`)
    return user
  }

  async getUserById(id: number) {
    const user = await this.usersRepository.findOne({ where: { id } })
    return user
  }

  async getUserByEmail(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } })
    return user
  }

  async verifEmailStart(dto: EmailDto) {
    const created = await this.usersRepository.findOne({ where: { email: dto.email } })
    if (created) throw new ConflictException([{
      field: 'email',
      errors: ['User with this email already exist']
    }])
    await this.cacheManager.del(`to-verif-email:${dto.email}`)
    await this.cacheManager.del(`verif-email:${dto.email}`)
    await this.cacheManager.set(`to-verif-email:${dto.email}`, '12345', { ttl: 600 })
    return dto.email
  }

  async verifEmailSubmit(dto: VerifSubmitDto) {
    const code = await this.cacheManager.get(`to-verif-email:${dto.email}`)
    if (!code) throw new ValidationException([{
      field: 'email',
      errors: ['You must send code to this email before submit']
    }])
    const equals = dto.code === code
    if (!equals) throw new ValidationException([{
      field: 'code',
      errors: ['Invalid code']
    }])

    await this.cacheManager.del(`to-verif-email:${dto.email}`)
    await this.cacheManager.set(`verif-email:${dto.email}`, true, { ttl: 900 })

    return
  }

  async test(user: UserModel) {
    const userr = await this.usersRepository.findByPk(user.id, { include: [CollectionModel, NftModel] })

    await userr.save()

    return userr
  }

  async getUserByWallet(wallet: string) {
    const user = await this.usersRepository.findOne({ where: { wallet } })
    return user
  }

  async updateWalletState(user_id: number) {
    const user = await this.getUserById(user_id)
    if (!user) throw new ValidationException([{
      field: 'user_id',
      errors: ['No users with this id']
    }])

    for(const wallet in user.wallet_amounts) {
      if (!wallets_contracts[wallet].network) {
        const wallet_amount = parseFloat(this.web3Service.toEther(await this.web3Service.getBalanceERC20(user.wallet, wallets_contracts[wallet].address, wallets_contracts[wallet].abi)))
        user.wallet_amounts[wallet] = { wallet_amount }
      } else {
        const wallet_amount = parseFloat(this.web3Service.toEther(await this.web3Service.getBalance(user.wallet)))
        user.wallet_amounts[wallet] = { wallet_amount }
      }
    }

    await this.usersRepository.update({
      ...user,
      wallet_amounts: user.wallet_amounts
    }, { where: { id: user_id } })
    return {
      wallet_amounts: {
        ...user.wallet_amounts
      }
    }
  }

  async getUserWithNfts(user_id: number) {
    const user = (await this.usersRepository.findByPk(user_id, { include: [{ model: NftModel, include: [CollectionModel, CategoryModel] }] }))
    return user
  }

  async uploadSeal(user_id: number, file: any) {
    const fileStatus: any = await this.filesService.uploadFile(file, 'seal')
    if (!fileStatus) throw new InternalServerErrorException()
    const res = await this.sealsRepository.create({
      name: file.originalname,
      user_id,
      seal_url: fileStatus.Location
    })

    return {
      name: file.originalname,
      seal_url: fileStatus.Location
    }
  }

  async getSeal(user_id: number, url: string) {
    return await this.sealsRepository.findOne({ where: { seal_url: url ?? '', user_id } });
  }

  async getSeals(user_id: number) {
    return (await this.sealsRepository.findAll({ where: { user_id } })).map((s) => ({ name: s.name, seal_url: s.seal_url }))
  }

  async updateProfileData(dto: UpdateProfileDto, user_id: number, avatar) {
    let user = await this.getUserById(user_id)
    const configured = {
      first_name: dto.first_name ?? user.first_name,
      last_name: dto.last_name ?? user.last_name,
      nickname: dto.nickname ?? user.nickname,
      avatar: avatar ? null : user.avatar
    }
    if (avatar) {
      const fileUploadStatus: any = await this.filesService.uploadFile(avatar, 'avatar')
      configured.avatar = fileUploadStatus.Location
    }
    await user.update(configured)
    return user.getPublicData()
  }

  async getUserByEmailNickname(to_user: string) {
    return await this.usersRepository.findOne({ where: { [Op.or]: [{ email: to_user }, { nickname: to_user }] } })
  }

  async resetPassword(user_id: number) {
    const user = await this.getUserById(user_id)
    if (!user) return

    const token = randomUUID()
    const res = await this.cacheManager.set(`change-password:${token}`, user.id, { ttl: 1200 })
    console.log(token);

    //TODO: Отправка письма с ссылкой на почту
  }

  async newPassword(dto: ResetPasswordDto, user_id: number) {
    const user = await this.getUserById(user_id)
    if (!user) return

    const uid = await this.cacheManager.get(`change-password:${dto.token}`)
    if (uid !== user.id) throw new ForbiddenException([{
      field: 'auth',
      errors: ['Forbidden']
    }])

    const hashPassword = await hash(dto.password, await genSalt(10));
    user.password = hashPassword
    await user.save()
    const data = await this.cacheManager.get(
      `usr:${user.id}`,
    )

    if (data) {
      const tokens = JSON.parse(data)
      await this.cacheManager.del(`access-token:${tokens.accessToken}`)
      await this.cacheManager.del(`refresh-token:${tokens.refreshToken}`)
      await this.cacheManager.del(`change-password:${dto.token}`)
      await this.cacheManager.del(`usr:${user.id}`)
      return
    }
    //TODO: Отправка письма с ссылкой на почту
  }
}
