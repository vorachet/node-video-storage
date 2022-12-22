import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const DEFAULT_JWT_SECRET =
  '207e8316269bf3a21d6715151d42d4383f11cde80c6c5f5f984647c48715ee78';

@Injectable()
export class AuthService {
  generateToken(userId: string, password: string, expiresIn: string) {
    if (!userId || !password) {
      return null;
    }
    const mockUser = {
      userId: userId,
    };

    try {
      return jwt.sign(
        {
          ...mockUser,
          algorithm: 'HS256',
        },
        process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
        {
          expiresIn: expiresIn,
        },
      );
    } catch (error) {
      return null;
    }
  }

  verifyToken(token: string): JwtPayload {
    try {
      const jwtPayload: JwtPayload = jwt.verify(
        token,
        process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
      ) as JwtPayload;
      return jwtPayload;
    } catch (error) {
      return null;
    }
  }
}
