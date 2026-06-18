import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { AppError } from '../utils/AppError';

const signAccessToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']) || '15m',
  });
};

const signRefreshToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']) || '7d',
  });
};

export class AuthService {
  static async generateTokens(user: IUser) {
    const accessToken = signAccessToken((user._id as any).toString());
    const refreshToken = signRefreshToken((user._id as any).toString());

    // Save refresh token to DB
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: new Date(decoded.exp * 1000),
    });

    return { accessToken, refreshToken };
  }

  static async verifyRefreshToken(token: string) {
    const storedToken = await RefreshToken.findOne({ token }).populate('user');
    if (!storedToken) {
      throw new AppError('Refresh token is invalid or expired', 401);
    }

    try {
      jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
      return storedToken.user as unknown as IUser;
    } catch (err) {
      // If verification fails, delete the token from DB
      await RefreshToken.deleteOne({ _id: storedToken._id });
      throw new AppError('Refresh token expired', 401);
    }
  }

  static async clearRefreshToken(token: string) {
    await RefreshToken.deleteOne({ token });
  }

  static async clearAllRefreshTokens(userId: string) {
    await RefreshToken.deleteMany({ user: userId });
  }
}
