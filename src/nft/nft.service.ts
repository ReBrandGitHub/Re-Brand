import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ForbiddenException } from '../exceptions/forbidden.exception';
import { Role } from '../roles/role.enum';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { NftModel } from './models/nft.model';
import { CollectionModel } from './models/collection.model';
import { ValidationException } from '../exceptions/validation.exception';
import { CollectionDto } from './dto/collection.dto';
import { FilesService } from '../files/files.service';
import { NftUserModel } from './models/nft-user.model';
import { Web3Service } from '../web3/web3.service';
import { CategoryModel } from './models/category.model';
import { CategoryDto } from './dto/category.dto';
import { NftRequestModel } from './models/nft-request.model';
import { ConflictException } from '../exceptions/conflict.exception';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';
import { IdDto } from '../admin/dto/id.dto';
import { TransferNftDto, WithdrawNftDto } from './dto/transfer.dto';

@Injectable()
export class NftService {
  constructor(private usersService: UsersService,
              private filesService: FilesService,
              private web3Service: Web3Service,
              @InjectModel(CollectionModel) private collectionRepository: typeof CollectionModel,
              @InjectModel(NftModel) private nftRepository: typeof NftModel,
              @InjectModel(NftRequestModel) private nftRequestRepository: typeof NftRequestModel,
              @InjectModel(CategoryModel) private categoryRepository: typeof CategoryModel,
              @InjectModel(NftUserModel) private nftUserRepository: typeof NftUserModel) {
  }

  async getCategory(name: string) {
    return await this.collectionRepository.findOne({
      where: {
        name,
      },
    });
  }

  async getCollection(name: string, user_id: number) {
    return await this.collectionRepository.findOne({
      where: {
        name,
        [Op.or]: [{ user_id }, { global: true }],
      },
    });
  }

  async validateCategories(names: string[]) {
    const categories = await this.categoryRepository.findAll({
      where: {
        name: {
          [Op.in]: names,
        },
      },
    });
    const validated = [];
    for (const name of names) {
      const found = categories.find((c) => c.name === name);
      if (found) {
        validated.push(true);
      }
    }
    if (validated.length !== names.length) {
      throw new ValidationException([{
        field: 'category_name',
        errors: ['Invalid category name'],
      }]);
    } else {
      return categories;
    }
  }

  async validateCollections(names: string[], user_id: number) {
    const collections = await this.collectionRepository.findAll({
      where: {
        [Op.and]: [
          {
            name: {
              [Op.in]: names,
            },
          },
          { [Op.or]: [{ user_id }, { global: true }] },
        ],
      },
    });
    const validated = [];
    for (const name of names) {
      const found = collections.find((c) => c.name === name);
      if (found) {
        validated.push(true);
      }
    }
    if (validated.length !== names.length) {
      throw new ValidationException([{
        field: 'collection_name',
        errors: ['Invalid collection name'],
      }]);
    } else {
      return collections;
    }
  }

  async validateCategory(name: string) {
    const category = await this.categoryRepository.findOne({
      where: {
        name,
      },
    });
    if (!category) {
      throw new ValidationException([{
        field: 'category_name',
        errors: ['Invalid category name'],
      }]);
    } else {
      return category;
    }
  }

  async validateCollection(name: string, user_id: number) {
    const collection = await this.collectionRepository.findOne({
      where: {
        name,
        [Op.or]: [{ user_id }, { global: true }],
      },
    });
    if (!collection) {
      throw new ValidationException([{
        field: 'collection_name',
        errors: ['Invalid collection name'],
      }]);
    } else {
      return collection;
    }
  }

  async validateUser(user_id: number) {
    const user = await this.usersService.getUserById(user_id);
    if (!user) {
      throw new UnauthorizedException([{
        field: 'auth',
        errors: ['Unauthorized'],
      }]);
    }
    return user;
  }

  async validateAdmin(user_id: number) {
    const user = await this.usersService.getUserById(user_id);
    if (!user || (user.role !== Role.Admin && user.role !== Role.Superadmin)) {
      throw new ForbiddenException([{
        field: 'user',
        errors: ['You are not allowed for this'],
      }]);
    }
    return user;
  }

  //КОЛЛЕКЦИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ
  async createCollectionByUser(dto: CollectionDto, user_id: number) {
    const created = await this.collectionRepository.findOne({ where: { name: dto.name } });
    if (created) {
      throw new ValidationException([{
        field: 'name',
        errors: ['Collection with this name already exist'],
      }]);
    }

    // TODO: СДЕЛАТЬ ЗАГРУЗКУ НА S3
    const collection = await this.collectionRepository.create({
      name: dto.name,
      user_id,
      description: dto.description,
      global: false,
      image: '',
    });
    return collection.getUserCollection();
  }

  //ГЛОБАЛЬНАЯ КОЛЛЕКЦИЯ ДЛЯ АДМИНИСТРАТОРА
  async createGlobalCollection(dto: CollectionDto, file) {
    // await this.validateAdmin(user_id)
    const created = await this.collectionRepository.findOne({ where: { name: dto.name } });
    if (created) {
      throw new ValidationException([{
        field: 'name',
        errors: ['Collection with this name already exist'],
      }]);
    }

    // TODO: СДЕЛАТЬ ЗАГРУЗКУ НА S3

    const fileUploadStatus: any = file ? await this.filesService.uploadFile(file, 'image') : null
    if (!fileUploadStatus && file) {
      throw new InternalServerErrorException('Image upload error');
    }

    const collection = await this.collectionRepository.create({
      name: dto.name,
      description: dto.description,
      global: true,
      image: fileUploadStatus.Location ?? null,
    });
    return collection.getUserCollection();
  }

  async assignUserToNft(user_id: number, nft_id: number, amount: number) {
    return this.nftUserRepository.create({ user_id, nft_id, amount });
  }

  async getUserCollections(id: number) {
    return (await this.collectionRepository.findAll({ where: { [Op.or]: [{ user_id: id }, { global: true }] } })).map((c) => c.name);
  }

  async getUserNfts(user_id: number) {
    const user = await this.usersService.getUserWithNfts(user_id);
    const balances = await this.web3Service.getNftBalances(user.wallet, user.nfts.map((nft) => nft.id));
    return user.nfts.map((nft) => nft.getUserInnerData(nft.collection, nft.category, user, balances[nft.id])).reverse();
  }

  async getUserNft(user_id: number, nft_id: number) {
    const user = await this.validateUser(user_id);
    const token = await this.nftUserRepository.findOne({
      where: { nft_id, user_id },
      include: [{ model: NftModel, include: [CollectionModel, CategoryModel] }],
    });
    if (!token) {
      throw new ValidationException([{
        field: 'nft_id',
        errors: ['No user tokens with this id'],
      }]);
    }
    const balance = await this.web3Service.getNftBalance(user.wallet, token.nft.id);
    return {
      token: token.nft.getUserInnerData(token.nft.collection, token.nft.category, user, balance),
      user,
      th: token,
    };
  }

  async createCategory(dto: CategoryDto, file) {
    const created = await this.categoryRepository.findOne({ where: { name: dto.name } });
    if (created) {
      throw new ConflictException([{
        field: 'name',
        errors: ['Category with this name already exist'],
      }]);
    }
    const related_id = dto.related_id ? parseInt(dto.related_id) : null;
    if (related_id) {
      const related = await this.categoryRepository.findOne({ where: { id: related_id } });
      if (!related) {
        throw new ValidationException([{
          field: 'related_id',
          errors: ['No category with this id'],
        }]);
      }
    }

    const fileUploadStatus: any = file ? await this.filesService.uploadFile(file, 'image') : null
    if (!fileUploadStatus && file) {
      throw new InternalServerErrorException('Image upload error');
    }

    // TODO: СДЕЛАТЬ ЗАГРУЗКУ НА S3
    const category = await this.categoryRepository.create({
      name: dto.name,
      description: dto.description,
      image: fileUploadStatus.Location ?? null,
      ...(related_id && {
        category_id: related_id,
      }),
    });
    return category.getPublicData();
  }

  async getCategories() {
    return (await this.categoryRepository.findAll({ include: [{ model: CategoryModel }] })).map((c) => c.getPublicData(c.category));
  }

  async getLastNftRequests(page: number) {
    return (await this.nftRequestRepository.findAll({
      where: { verified: false },
      limit: 10,
      offset: (page - 1) * 10,
      include: [CollectionModel, CategoryModel],
    })).map((r) => r.getRequestData(r.category, r.collection));
  }

  async verifToken(dto: IdDto) {
    const nft = await this.nftRequestRepository.findOne({
      where: { id: dto.id, verified: false },
      include: [CollectionModel, CategoryModel],
    });
    if (!nft) {
      throw new ValidationException([{
        field: 'id',
        errors: ['No requests with this id'],
      }]);
    }

    nft.verified = true;
    await nft.save();
    return nft.getRequestData(nft.category, nft.collection);
  }

  async transferNft(dto: TransferNftDto, user_id: number) {
    const { token, user, th } = await this.getUserNft(user_id, dto.token_id);
    const to = await this.usersService.getUserByEmailNickname(dto.to_user);
    if (!to) {
      throw new ValidationException([{
        field: 'to_user',
        messages: ['Invalid user'],
      }]);
    }
    if (dto.quantity > token.balance) {
      throw new ValidationException([{
        field: 'quantity',
        messages: ['You have not enough tokens'],
      }]);
    }
    //TODO: УЧЁТ КОМИССИЙ СЕТИ
    const cost = parseFloat(this.web3Service.toEther(await this.web3Service.transferTokenToPrice(user.wallet, to.wallet, token.id, dto.quantity)));
    if (user.wallet_amounts.bsc.wallet_amount < cost) {
      throw new ValidationException([{
        field: 'amount',
        errors: ['You have no enough money'],
      }]);
    }
    const res = await this.web3Service.transferTokenTo(user.wallet, to.wallet, token.id, dto.quantity);
    if (dto.quantity === token.balance) {
      await th.destroy();
    }
    await this.usersService.updateWalletState(user_id);
    return true;
  }

  async withdrawNft(dto: WithdrawNftDto, user_id: number) {
    const { token, user, th } = await this.getUserNft(user_id, dto.token_id);
    await this.web3Service.validateWallet(dto.wallet);
    if (dto.quantity > token.balance) {
      throw new ValidationException([{
        field: 'quantity',
        messages: ['You have not enough tokens'],
      }]);
    }
    //TODO: УЧЁТ КОМИССИЙ СЕТИ
    const cost = parseFloat(this.web3Service.toEther(await this.web3Service.transferTokenToPrice(user.wallet, dto.wallet, token.id, dto.quantity)));
    if (user.wallet_amounts.bsc.wallet_amount < cost) {
      throw new ValidationException([{
        field: 'amount',
        errors: ['You have no enough money'],
      }]);
    }
    const res = await this.web3Service.transferTokenTo(user.wallet, dto.wallet, token.id, dto.quantity)
    if (dto.quantity === token.balance) {
      await th.destroy()
    }
    await this.usersService.updateWalletState(user_id)
    return true
  }
}
