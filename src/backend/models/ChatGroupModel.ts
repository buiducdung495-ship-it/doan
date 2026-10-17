import { MockDB } from './MockDB';
import { ChatGroup } from '../../types';

export class ChatGroupModel {
  static findAll(): ChatGroup[] {
    return MockDB.getCollection('chatGroups' as any) || [];
  }
  
  static create(group: ChatGroup): ChatGroup {
    return MockDB.insertOne('chatGroups' as any, group);
  }

  static update(id: string, updatedFields: Partial<ChatGroup>): ChatGroup | null {
    const groups = this.findAll();
    const group = groups.find(g => g.id === id);
    if (!group) return null;
    Object.assign(group, updatedFields);
    MockDB.save();
    return group;
  }
}
