export class ApiCalledEvent {
  public operation: string;
  public created: Date;
  constructor(init?: Partial<ApiCalledEvent>) {
    Object.assign(this, init);
  }
}
