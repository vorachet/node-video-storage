import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindSpec {
  @ApiPropertyOptional()
  public name: string;
  @ApiPropertyOptional({
    description: 'duraiton in sec',
  })
  public minDuration: number;
  @ApiPropertyOptional()
  public contentType: string;
  @ApiPropertyOptional()
  public limit: string;
  @ApiPropertyOptional()
  public skip: string;
  @ApiPropertyOptional()
  public sort: any;
  constructor(init?: Partial<FindSpec>) {
    Object.assign(this, init);
  }
}
