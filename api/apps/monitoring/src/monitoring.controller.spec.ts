import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';

describe('MonitoringController', () => {
  let monitoringController: MonitoringController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [MonitoringService],
    }).compile();

    monitoringController = app.get<MonitoringController>(MonitoringController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(monitoringController.getHello()).toBe('Hello World!');
    });
  });
});
