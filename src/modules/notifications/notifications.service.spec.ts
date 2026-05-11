import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from '../../shared/firebase/firebase.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let firebaseService: jest.Mocked<Partial<FirebaseService>>;

  const mockMessaging = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    firebaseService = {
      messaging: mockMessaging as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: FirebaseService, useValue: firebaseService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('sendToDevice', () => {
    it('should send notification to a device token', async () => {
      mockMessaging.send.mockResolvedValue('response-id');
      const result = await service.sendToDevice('token123', 'Title', 'Body', { key: 'val' });
      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'token123',
          notification: { title: 'Title', body: 'Body' },
          data: { key: 'val' },
        }),
      );
      expect(result).toBe('response-id');
    });

    it('should warn and return if messaging is not initialized', async () => {
      firebaseService.messaging = undefined as any;
      const result = await service.sendToDevice('token', 'T', 'B');
      expect(result).toBeUndefined();
    });
  });

  describe('sendToTopic', () => {
    it('should send notification to a topic', async () => {
      mockMessaging.send.mockResolvedValue('topic-response');
      const result = await service.sendToTopic('news', 'Topic Title', 'Topic Body');
      expect(mockMessaging.send).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'news',
          notification: { title: 'Topic Title', body: 'Topic Body' },
        }),
      );
      expect(result).toBe('topic-response');
    });

    it('should return if messaging is not initialized', async () => {
      firebaseService.messaging = undefined as any;
      const result = await service.sendToTopic('news', 'T', 'B');
      expect(result).toBeUndefined();
    });
  });
});
