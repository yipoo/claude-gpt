const jwt = require('jsonwebtoken');
import { config } from '@/config/app';

export class JWTService {
  /**
   * 生成访问令牌
   */
  static generateAccessToken(payload: any): string {
    return jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * 生成刷新令牌
   */
  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * 验证令牌
   */
  static verifyToken(token: string): any {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的Token');
      } else {
        throw new Error('Token验证失败');
      }
    }
  }

  /**
   * 从请求头中提取令牌
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    // Bearer token format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * 解码令牌（不验证签名）
   */
  static decodeToken(token: string): any | null {
    try {
      const decoded = jwt.decode(token);
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * 检查令牌是否即将过期（剩余时间小于指定分钟数）
   */
  static isTokenExpiringSoon(token: string, minutesThreshold: number = 15): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - currentTime;
      const thresholdSeconds = minutesThreshold * 60;

      return timeUntilExpiry < thresholdSeconds;
    } catch (error) {
      return true;
    }
  }

  /**
   * 获取令牌剩余有效时间（秒）
   */
  static getTokenRemainingTime(token: string): number {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return 0;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return Math.max(0, decoded.exp - currentTime);
    } catch (error) {
      return 0;
    }
  }
}