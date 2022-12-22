import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtPayload } from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { TokenRequest } from './entities/tokenRequest.entity';

@Controller({
  version: process.env.FILES_STORAGE_VERSION || '1',
})
@ApiTags('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('generateToken')
  @ApiOperation({
    description: 'Generate access token for secured operations',
  })
  @ApiResponse({
    status: 201,
    description: 'Token successfully generated',
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid request',
  })
  generateToken(@Body() payload: TokenRequest) {
    const token = this.authService.generateToken(
      payload.userId,
      payload.password,
      process.env.JWT_EXPIRES_IN || '1h',
    );

    if (!token) {
      const errorMessage = 'Invalid account';
      this.logger.error(errorMessage);
      throw new HttpException(errorMessage, HttpStatus.FORBIDDEN);
    }

    return token;
  }

  @Get('verifyToken/:token')
  @ApiOperation({
    description: 'Verify access token for secured operations',
  })
  @ApiResponse({
    status: 200,
    description: 'Token successfully verified',
  })
  @ApiResponse({
    status: 403,
    description: 'Invalid token',
  })
  verifyToken(@Param('token') token: string) {
    const tokenPayload: JwtPayload = this.authService.verifyToken(token);
    if (!tokenPayload) {
      const errorMessage = 'Invalid token';
      this.logger.error(errorMessage);
      throw new HttpException(errorMessage, HttpStatus.FORBIDDEN);
    }
    return tokenPayload;
  }
}
