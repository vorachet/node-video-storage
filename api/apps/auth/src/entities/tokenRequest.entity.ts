import { ApiProperty } from '@nestjs/swagger';

export class TokenRequest {
  @ApiProperty()
  public userId: string;
  @ApiProperty()
  public password: string;
  constructor(init?: Partial<TokenRequest>) {
    Object.assign(this, init);
  }
}
