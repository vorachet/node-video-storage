import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

const BLOCK = false;

@Injectable()
export class JWTGuard implements CanActivate {
  private readonly logger = new Logger(JWTGuard.name);
  constructor(private readonly authService: AuthService) {}

  async handleHTTPAuthorization(
    context: ExecutionContext,
    request: Request | any,
    authorization: string,
  ) {
    return new Promise((resolve) => {
      if (!authorization) {
        return resolve(BLOCK);
      }
      const authHeaderValues = authorization.split(' ');
      if (authHeaderValues.length != 2) {
        return resolve(BLOCK);
      }

      const token = this.authService.verifyToken(authHeaderValues[1]);
      if (token) {
        request.token = token;
        this.logger.verbose(`validating JWT...OK`);
        return resolve(!BLOCK);
      } else {
        this.logger.error(`validating JWT...Invalid token`);
        return resolve(BLOCK);
      }
    });
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    return new Promise((resolve) => {
      const request = context.switchToHttp().getRequest();
      const authorization = request.get('authorization');
      return this.handleHTTPAuthorization(context, request, authorization).then(
        (isBlock: boolean) => resolve(isBlock),
      );
    });
  }
}
