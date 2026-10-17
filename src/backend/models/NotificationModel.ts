import { MockDB } from './MockDB';
import { Notification } from '../../types';

export class NotificationModel {
  static findAll(): Notification[] {
    return MockDB.getCollection('notifications');
  }

  static findByUserId(userId: string): Notification[] {
    return MockDB.find('notifications', n => n.userId === userId);
  }

  static create(notification: Notification): Notification {
    return MockDB.insertOne('notifications', notification);
  }

  static markAllAsRead(userId: string): void {
    const list = MockDB.getCollection('notifications');
    list.forEach(n => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    MockDB.save();
  }

  static markAsRead(id: string): void {
    MockDB.updateOne('notifications', n => n.id === id, { read: true });
  }
}
