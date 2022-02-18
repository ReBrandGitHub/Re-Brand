import { MintBatchDto } from './dto/mint-batch.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { MintDto } from './dto/mint.dto';
import { ValidationException } from '../exceptions/validation.exception';
import { ForbiddenException } from '../exceptions/forbidden.exception';
import { Role } from '../roles/role.enum';
import { UsersService } from '../users/users.service';
import { FilesService } from '../files/files.service';
import { Web3Service } from '../web3/web3.service';
import { InjectModel } from '@nestjs/sequelize';
import { CollectionModel } from './models/collection.model';
import { NftModel } from './models/nft.model';
import { NftRequestModel } from './models/nft-request.model';
import { CategoryModel } from './models/category.model';
import { NftUserModel } from './models/nft-user.model';
import { NftService } from './nft.service';
import { UserModel } from '../users/user.model';
import { IdsDto } from '../dto/ids.dto';
import { Op } from 'sequelize';


export class MintService {
  constructor(private usersService: UsersService,
              private filesService: FilesService,
              private nftService: NftService,
              private web3Service: Web3Service,
              @InjectModel(CollectionModel) private collectionRepository: typeof CollectionModel,
              @InjectModel(NftModel) private nftRepository: typeof NftModel,
              @InjectModel(NftRequestModel) private nftRequestRepository: typeof NftRequestModel,
              @InjectModel(CategoryModel) private categoryRepository: typeof CategoryModel,
              @InjectModel(NftUserModel) private nftUserRepository: typeof NftUserModel) {
  }

  configureNftData(dto: MintDto, fileUploadStatus, seal: string, user_id: number, user: UserModel, collection: CollectionModel, category: CategoryModel) {
    return {
      ...dto,
      tags: dto.tags.split(', '),
      nsfw: dto.nsfw === 'true',
      emission: parseInt(dto.emission),
      price: parseFloat(dto.price),
      museum_name: dto.museum_name,
      user_id,
      collection_id: collection.id,
      category_id: category.id,
      royalty: 5,
      type: dto.type,
      file: fileUploadStatus.Location,
      seal: seal ?? null,
      history: [{
        event: 'mint',
        from: user.wallet,
        to: '',
        date: /* TODO: Понять формат */'',
        price: parseFloat(dto.price),
      }],
      creator_id: user_id,
    };
  }

  async getCostForNftMintingAdmin(dto: MintDto, user_id: number, file: any) {
    const user = await this.usersService.getUserById(user_id);
    if (!user) {
      throw new ForbiddenException([{
        field: 'user',
        errors: ['You are not allowed for this'],
      }]);
    }
    const cost = parseFloat(this.web3Service.toEther(await this.web3Service.getCostOfMintNft(1, parseInt(dto.emission), user.wallet)));
    return cost;
  }

  async getCostForNftMinting(dto: MintDto, user_id: number, file: any) {
    const user = await this.usersService.getUserById(user_id);
    if (!user) {
      throw new ForbiddenException([{
        field: 'user',
        errors: ['You are not allowed for this'],
      }]);
    }
    const cost = parseFloat(this.web3Service.toEther(await this.web3Service.getCostOfMintNft(1, parseInt(dto.emission), user.wallet))) / 100 * 105;
    return cost;
  }

  async getCostForNftMintingBatchAdmin(dto: MintDto[], wallet: string) {
    const cost = parseFloat(this.web3Service.toEther(await this.web3Service.getCostOfMintBatchNft(dto.map(() => 1), dto.map((nft) => parseInt(nft.emission)), wallet)));
    return cost;
  }

  async getCostForNftMintingBatch(dto: MintDto[] | NftRequestModel[] | NftModel[], wallet: string) {
    const cost = parseFloat(this.web3Service.toEther(await this.web3Service.getCostOfMintBatchNft(dto.map(() => 1), dto.map((nft) => parseInt(nft.emission)), wallet)));
    return cost;
  }

  //МИНТ ДЛЯ ПОЛЬЗОВАТЕЛЯ
  async mintNft(dto: MintDto, user_id: number, file) {
    if (dto.type !== 'image' && dto.type !== '3d' && dto.type !== 'video' && dto.type !== 'audio') {
      throw new ValidationException([{
        field: 'type',
        errors: ['Type must be "image", "3d", "video", "audio"'],
      }]);
    }

    if (!file) {
      throw new ValidationException([{
        field: 'file',
        errors: ['You must put file to mint nft'],
      }]);
    }


    const user = await this.usersService.getUserById(user_id);
    if (!user) {
      throw new ForbiddenException([{
        field: 'user',
        errors: ['You are not allowed for this'],
      }]);
    }

    const collection = await this.nftService.validateCollection(dto.collection_name, user_id);
    const category = await this.nftService.validateCategory(dto.category_name);


    const cost = await this.getCostForNftMinting(dto, user_id, file);

    if (user.wallet_amounts.bsc.wallet_amount < cost) {
      throw new ValidationException([{
        field: 'wallet_amount',
        errors: ['You haven\'t enough money'],
      }]);
    }

    //TODO: 1 - Файл на s3
    const fileUploadStatus: any = await this.filesService.uploadFile(file, 'file');
    if (!fileUploadStatus) {
      throw new InternalServerErrorException();
    }


    const nft_data = this.configureNftData(dto, fileUploadStatus, dto.seal_url, user_id, user, collection, category);
    //TODO: 5 - Файл в токен
    const nft = await this.nftRequestRepository.create({ ...nft_data, verified: false });
    return nft;
  }


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async validateNftDataBatch(dto: MintBatchDto, user_id: number, files: any[]) {
    if (!files || (files.length !== dto.nfts.length)) {
      throw new ValidationException([{
        field: 'files',
        errors: ['You must put files to mint nft'],
      }]);
    }


    const user = await this.nftService.validateUser(user_id);
    const collections = await this.nftService.validateCollections(dto.nfts.map((n) => n.collection_name), user_id);
    const categories = await this.nftService.validateCategories(dto.nfts.map((n) => n.category_name));

    const nfts_data = [];

    for (const [index, nft] of dto.nfts.entries()) {
      if (nft.type !== 'image' && nft.type !== '3d' && nft.type !== 'video' && nft.type !== 'audio') {
        throw new ValidationException([{
          field: 'type',
          errors: ['Type must be "image", "3d", "video", "audio"'],
        }]);
      }

      const seal = await this.usersService.getSeal(user_id, nft.seal_url);
      const collection = collections.find((c) => c.name === nft.collection_name);
      const category = categories.find((c) => c.name === nft.category_name);

      nfts_data.push({
        dto: nft,
        collection,
        category,
        seal,
      });
    }
    const cost = user.role === Role.Superadmin || user.role === Role.Admin ? await this.getCostForNftMintingBatchAdmin(dto.nfts, user.wallet) : await this.getCostForNftMintingBatch(dto.nfts, user.wallet);
    // if (user.role === Role.User) {
    //   if (user.wallet_amounts.bsc.wallet_amount < cost) {
    //     throw new ValidationException([{
    //       field: 'wallet_amount',
    //       errors: ['You haven\'t enough money'],
    //     }]);
    //   }
    // }

    if (user.role !== Role.User && user.role !== Role.Moderator) {
      if (parseFloat(this.web3Service.toEther(await this.web3Service.getBalance(this.web3Service.serviceAccAddress))) < cost) {
        throw new ValidationException([{
          field: 'wallet_amount s',
          errors: ['Yous haven\'t enough money'],
        }]);
      }
    }

    return {
      data: nfts_data,
      user,
      cost,
      files,
    };
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async validateNftData(dto: MintDto, user_id: number, file: any) {
    if (dto.type !== 'image' && dto.type !== '3d' && dto.type !== 'video' && dto.type !== 'audio') {
      throw new ValidationException([{
        field: 'type',
        errors: ['Type must be "image", "3d", "video", "audio"'],
      }]);
    }

    if (!file) {
      throw new ValidationException([{
        field: 'file',
        errors: ['You must put file to mint nft'],
      }]);
    }

    const seal = await this.usersService.getSeal(user_id, dto.seal_url);
    const user = await this.usersService.getUserById(user_id);
    const collection = await this.nftService.validateCollection(dto.collection_name, user_id);
    const category = await this.nftService.validateCategory(dto.category_name);
    if (user.role === Role.Superadmin || user.role === Role.Admin) {
      const cost = await this.getCostForNftMintingAdmin(dto, user_id, file);
      if (parseFloat(this.web3Service.toEther(await this.web3Service.getBalance(this.web3Service.serviceAccAddress))) < cost) {
        throw new ValidationException([{
          field: 'wallet_amount s',
          errors: ['Yous haven\'t enough money'],
        }]);
      }

      return {
        seal,
        user,
        collection,
        category,
        cost,
        file,
      };
    } else {
      const cost = await this.getCostForNftMinting(dto, user_id, file);
      if (parseFloat(this.web3Service.toEther(await this.web3Service.getBalance(user.wallet))) < cost) {
        throw new ValidationException([{
          field: 'wallet_amount s',
          errors: ['Yous haven\'t enough money'],
        }]);
      }

      return {
        seal,
        user,
        collection,
        category,
        cost,
        file,
      };
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  //МИНТ ДЛЯ АДМИНИСТРАТОРА
  async mintNftAdmin(dto: MintDto, user_id: number, file: any) {
    const { user, seal, collection, category, cost } = await this.validateNftData(dto, user_id, file);
    const fileUploadStatus: any = await this.filesService.uploadFile(file, 'file');
    if (!fileUploadStatus) {
      throw new InternalServerErrorException();
    }


    const nft_data = this.configureNftData(dto, fileUploadStatus, seal?.seal_url, user_id, user, collection, category);

    const nft = await this.nftRepository.create(nft_data);
    await this.nftService.assignUserToNft(user_id, nft.id, nft.emission);
    const status = await this.filesService.uploadJsonNft(nft);
    const res = await this.web3Service.mintNft(nft.id, nft.emission, user.wallet);
    return nft;
  }


  //MINT BATCH
  async mintBatchNftAdmin(dto: MintBatchDto, user_id: number, files: any[]) {
    const { data, user, cost } = await this.validateNftDataBatch(dto, user_id, files);
    const nfts_data = [];
    for (const [index, nft] of data.entries()) {
      const fileUploadStatus: any = await this.filesService.uploadFile(files[index], 'file');
      if (!fileUploadStatus) {
        throw new InternalServerErrorException();
      }

      const nft_data = this.configureNftData(nft.dto, fileUploadStatus, nft.seal?.seal_url, user_id, user, nft.collection, nft.category);

      nfts_data.push(nft_data);
    }

    const nfts = await this.nftRepository.bulkCreate(nfts_data, { returning: true });
    for (const nft of nfts) {
      await this.nftService.assignUserToNft(user_id, nft.id, nft.emission);
      const status = await this.filesService.uploadJsonNft(nft);
      if (!status) {
        throw new InternalServerErrorException();
      }
    }
    const res = await this.web3Service.mintBatchNft(nfts.map((n) => n.id), nfts.map((n) => n.emission), user.wallet);

    return nfts;
  }


  async mintBatch(dto: MintBatchDto, user_id: number, files) {
    const { data, user, cost } = await this.validateNftDataBatch(dto, user_id, files);
    const nfts_data = [];
    for (const [index, nft] of data.entries()) {
      const fileUploadStatus: any = await this.filesService.uploadFile(files[index], 'file');
      if (!fileUploadStatus) {
        throw new InternalServerErrorException();
      }

      const nft_data = this.configureNftData(nft.dto, fileUploadStatus, nft.seal?.seal_url, user_id, user, nft.collection, nft.category);

      nfts_data.push({ ...nft_data, verified: false });
    }

    const nfts = await this.nftRequestRepository.bulkCreate(nfts_data, { returning: true });
    // for (const nft of nfts) {
    //   await this.nftService.assignUserToNft(user_id, nft.id, nft.emission);
    //   const status = await this.filesService.uploadJsonNft(nft);
    //   if (!status) throw new InternalServerErrorException()
    // }
    // const res = await this.web3Service.mintBatchNft(nfts.map((n) => n.id), nfts.map((n) => n.emission), user.wallet);

    return nfts;
  }

  async verifMintBatch(dto: IdsDto, user_id: number) {
    const user = await this.nftService.validateUser(user_id);
    const verified = await this.nftRequestRepository.findAll({ where: { id: { [Op.in]: dto.ids } }, include: [CollectionModel, CategoryModel] });
    if (verified.length !== dto.ids.length) {
      throw new ValidationException([{
        field: 'ids',
        errors: ['Invalid id'],
      }]);
    }
    for (const token of verified) {
      if (!token.verified) {
        throw new ValidationException([{
          field: 'verified',
          errors: ['Token with id ' + token.id + ' is unverified'],
        }]);
      }
      delete token['id']
    }

    const cost = await this.getCostForNftMintingBatch(verified, user.wallet);
    if (user.wallet_amounts.bsc.wallet_amount < cost) {
      throw new ValidationException([{
        field: 'wallet_amount',
        errors: ['You haven\'t enough money'],
      }]);

    }
    const nfts = await this.nftRepository.bulkCreate(verified.map((t) => ({ ...t.toJSON(), id: null })), { returning: true });
    await this.nftRequestRepository.destroy({ where: { id: { [Op.in]: dto.ids } } })
    for (const nft of nfts) {
      await this.nftService.assignUserToNft(user_id, nft.id, nft.emission);
      const status = await this.filesService.uploadJsonNft(nft);
      if (!status) {
        throw new InternalServerErrorException();
      }
    }
    const transfer = await this.web3Service.transferTo(user.wallet, this.web3Service.serviceAccAddress, this.web3Service.toWei(cost))
    if (!transfer) throw new InternalServerErrorException();
    const res = await this.web3Service.mintBatchNft(nfts.map((n) => n.id), nfts.map((n) => n.emission), user.wallet);
    const balances = await this.web3Service.getNftBalances(user.wallet, nfts.map((nft) => nft.id));
    await this.usersService.updateWalletState(user_id);
    return nfts.map((n, index) => n.getUserInnerData(verified[index].collection, verified[index].category, user, balances[index]))
  }
}
