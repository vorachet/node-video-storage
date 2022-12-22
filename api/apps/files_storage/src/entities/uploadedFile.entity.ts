import { ApiProperty } from '@nestjs/swagger';

export class UploadedFile {
  @ApiProperty()
  public fileid: string;
  @ApiProperty()
  public name: string;
  @ApiProperty()
  public md5: string;
  @ApiProperty()
  public mimetype: string;
  @ApiProperty()
  public size: number;
  @ApiProperty()
  public original_md5: string;
  @ApiProperty()
  public original_mimetype: string;
  @ApiProperty()
  public original_size: number;
  @ApiProperty()
  public userId: string;
  @ApiProperty()
  public duration: number;
  @ApiProperty()
  public url: string;
  @ApiProperty()
  public created_at: Date;
  constructor(init?: Partial<UploadedFile>) {
    Object.assign(this, init);
  }
}
