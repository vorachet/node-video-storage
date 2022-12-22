export class FileUploadedEvent {
  public fileid: string;
  public created: Date;
  constructor(init?: Partial<FileUploadedEvent>) {
    Object.assign(this, init);
  }
}
