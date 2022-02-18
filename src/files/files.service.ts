import { Injectable, OnModuleInit } from '@nestjs/common';
import { NftModel } from '../nft/models/nft.model';
import { S3 } from 'aws-sdk';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService implements OnModuleInit {
  constructor() {

  }

  s3;

  onModuleInit() {
    this.s3 = new S3({
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      region: '',
      endpoint: 'https://rebrs3.digitaloceanspaces.com',
    });
  }

  async uploadJsonNft(nft: NftModel) {
    const json = {
      id: nft.id,
      name: nft.name,
      description: nft.description || undefined,
      image: nft.file,
      properties: {
        author: nft.museum_name || '',
      },
    };
    const data = await this.uploadS3(JSON.stringify(json), 'cpcs3', 'json/' + nft.id + '.json');
    return data;
  }

  async uploadS3(file, bucket, name) {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ACL: 'public-read',
    };
    return new Promise((resolve, reject) => {
      this.s3.upload(params, (err, data) => {
        if (err) {
          reject(err.message);
        }
        resolve(data);
      });
    });
  }

  async uploadFile(file, type: 'seal' | 'file' | 'avatar' | 'image') {
    const file_type = file.mimetype.split('/')[1];
    const name = randomUUID() + '-' + type + '.' + file_type;
    const data = await this.uploadS3(file.buffer, 'cpcs3',
      type === 'file' ? 'nfts/' :
        type === 'avatar' ? 'avatars/' :
          'images' + name);
    return data;
  }
}
