import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async setTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    accessTokenExpire: number,
    refreshTokenExpire: number,
  ) {
    await this.cacheManager.set(`access-token:${accessToken}`, userId, { ttl: accessTokenExpire });
    await this.cacheManager.set(`refresh-token:${refreshToken}`, userId, { ttl: refreshTokenExpire });
    await this.cacheManager.set(`usr:${userId}`, JSON.stringify({ refreshToken, accessToken }), { ttl: refreshTokenExpire });
    return
  }

  async getUserIdByAccessToken(accessToken) {
    return this.cacheManager.get(`access-token:${accessToken}`);
  }

  async getUserIdByRefreshToken(refreshToken) {
    return this.cacheManager.get(`refresh-token:${refreshToken}`);
  }

  async deleteCache(userId: string) {
    const data = await this.cacheManager.get(
      `usr:${userId}`,
    )

    if (data) {
      const tokens = JSON.parse(data)
      await this.cacheManager.del(`access-token:${tokens.accessToken}`)
      await this.cacheManager.del(`refresh-token:${tokens.refreshToken}`)
      await this.cacheManager.del(`usr:${userId}`)
      return
    }
    return
  }
}
