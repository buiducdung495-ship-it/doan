import { MockDB } from './MockDB';
import { ChatMessage } from '../../types';

export class ChatMessageModel {
  static findAll(): ChatMessage[] {
    return MockDB.getCollection('chats');
  }

  static create(msg: ChatMessage): ChatMessage {
    return MockDB.insertOne('chats', msg);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('chats', (m: any) => m.id === id);
  }

  static findById(id: string): ChatMessage | undefined {
    return MockDB.findOne('chats', (m: any) => m.id === id);
  }

  static update(id: string, update: Partial<ChatMessage>): boolean {
    return MockDB.updateOne('chats', (m: any) => m.id === id, update);
  }
}
