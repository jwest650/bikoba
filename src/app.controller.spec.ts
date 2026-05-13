import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('serves the docs HTML', () => {
      const html = appController.getDocs();
      expect(html).toContain('<title>Bikoba Auth API</title>');
      expect(html).toContain('/auth/register');
    });
  });
});
