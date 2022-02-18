import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { NftService } from './nft.service';
import { AuthTokenGuard } from '../guards/auth.token.guard';
import { Roles } from '../roles/roles.decorator';
import { Role } from '../roles/role.enum';
import { VerificationGuard } from '../guards/verification.guard';
import { MintDto } from './dto/mint.dto';
import { GetUser } from '../users/user.decorator';
import { UserModel } from '../users/user.model';
import { CollectionDto } from './dto/collection.dto';
import { ValidateFilePipe } from '../pipes/validate-file.pipe';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ValidationException } from '../exceptions/validation.exception';
import { CategoryDto } from './dto/category.dto';
import { MintBatchDto } from './dto/mint-batch.dto';
import { MintService } from './mint.service';
import { IdsDto } from '../dto/ids.dto';
import { TransferNftDto, WithdrawNftDto } from './dto/transfer.dto';
import { ValidateImagePipe } from '../pipes/validate-image.pipe';

@Controller('nft')
export class NftController {
  constructor(private nftService: NftService,
              private mintService: MintService) {
  }

  @Post('mint')
  @Roles(Role.User, Role.Admin, Role.Superadmin, Role.Moderator)
  @UsePipes(ValidateFilePipe)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  @UseInterceptors(FileInterceptor('file'))
  async mintNft(@UploadedFile() file, @Body() dto: MintDto, @GetUser() user: UserModel) {
    if (file) {
      if (user.role === Role.Superadmin || user.role === Role.Admin) {
        return await this.mintService.mintNftAdmin(dto, user.id, file);
      } else {
        // return await this.nftService.mintNft(dto, user.id, files[0], files[1]);
      }
    } else {
      throw new ValidationException([{
        field: 'file',
        errors: ['You must put file to mint nft'],
      }]);
    }
    return;
  }

  @Post('mint-batch/verif')
  @Roles(Role.User, Role.Moderator)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async verifMintNftBatch(@Body() dto: IdsDto, @GetUser() user: UserModel) {
    return await this.mintService.verifMintBatch(dto, user.id);
  }

  @Post('mint-batch')
  @Roles(Role.User, Role.Admin, Role.Superadmin, Role.Moderator)
  @UsePipes(ValidateFilePipe)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  @UseInterceptors(FilesInterceptor('files', 5))
  async mintNftBatch(@UploadedFiles() files, @Body() dto: MintBatchDto, @GetUser() user: UserModel) {
    if (user.role === Role.Superadmin || user.role === Role.Admin) {
      return await this.mintService.mintBatchNftAdmin(dto, user.id, files);
    } else {
      return await this.mintService.mintBatch(dto, user.id, files);
    }
    return;
  }

  @Post('mint/cost')
  @Roles(Role.User, Role.Admin, Role.Superadmin, Role.Moderator)
  @UsePipes(ValidateFilePipe)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  @UseInterceptors(FileInterceptor('file'))
  async mintNftCost(@UploadedFile() file, @Body() dto: MintDto, @GetUser() user: UserModel) {
    if (file) {
      if (user.role === Role.Superadmin || user.role === Role.Admin) {
        return await this.mintService.getCostForNftMintingAdmin(dto, user.id, file);
      }
    } else {
      throw new ValidationException([{
        field: 'file',
        errors: ['You must put file to mint nft'],
      }]);
    }
    return;
  }

  // @Post('nft-requests')
  // @Roles(Role.Admin, Role.Superadmin, Role.Moderator)
  // @UseGuards(AuthTokenGuard)
  // async getNftRequests(@Body() dto: GetNftRequestsAdmin) {
  //   if (files[0] && files[1]) {
  //     if (user.role === Role.Superadmin || user.role === Role.Admin) {
  //       return await this.nftService.getCostForNftMintingAdmin(dto, user.id, files[0], files[1]);
  //     }
  //   } else {
  //     throw new ValidationException([{
  //       field: 'files',
  //       errors: ['You must put files to mint nft'],
  //     }]);
  //   }
  //   return;
  // }

  @Post('collection/create/global')
  @Roles(Role.Admin, Role.Superadmin)
  @UsePipes(ValidateImagePipe)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  @UseInterceptors(FileInterceptor('image'))
  async createGlobalCollection(@UploadedFile() file, @Body() dto: CollectionDto, @GetUser() user: UserModel) {
    return await this.nftService.createGlobalCollection(dto, file);
  }

  @Post('category/create')
  @Roles(Role.Admin, Role.Superadmin)
  @UsePipes(ValidateImagePipe)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  @UseInterceptors(FileInterceptor('image'))
  async createCategory(@UploadedFile() file, @Body() dto: CategoryDto, @GetUser() user: UserModel) {
    return await this.nftService.createCategory(dto, file);
  }

  @Post('collections/user')
  @Roles(Role.User, Role.Admin, Role.Superadmin, Role.Moderator)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async getUserCollections(@GetUser() user: UserModel) {
    return await this.nftService.getUserCollections(user.id);
  }

  @Post('get-nfts')
  @Roles(Role.User, Role.Admin, Role.Superadmin, Role.Moderator)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async getUserNfts(@GetUser() user: UserModel) {
    return await this.nftService.getUserNfts(user.id);
  }

  @Get('categories')
  async getCategories() {
    return await this.nftService.getCategories();
  }

  @Post('transfer')
  @Roles(Role.User, Role.Admin, Role.Superadmin, Role.Moderator)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async transferNft(@Body() dto: TransferNftDto, @GetUser() user: UserModel) {
    return await this.nftService.transferNft(dto, user.id);
  }

  @Post('withdraw')
  @Roles(Role.User, Role.Admin, Role.Superadmin, Role.Moderator)
  @UseGuards(AuthTokenGuard, VerificationGuard)
  async withdrawNft(@Body() dto: WithdrawNftDto, @GetUser() user: UserModel) {
    return await this.nftService.withdrawNft(dto, user.id);
  }
}
