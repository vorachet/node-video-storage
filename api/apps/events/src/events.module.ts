import { Module } from '@nestjs/common';
import { ApiUsagesListener } from './listeners/apiUsages.listener';
import { FileChangesListener } from './listeners/fileChanges.listener';

@Module({
  imports: [],
  providers: [ApiUsagesListener, FileChangesListener],
})
export class EventsModule {}
