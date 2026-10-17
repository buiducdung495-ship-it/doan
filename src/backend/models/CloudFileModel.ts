import { MockDB } from './MockDB';
import { CloudFile } from '../../types';

export class CloudFileModel {
  static findById(id: string): CloudFile | undefined {
    return MockDB.findOne('cloudFiles', f => f.id === id);
  }

  static findByUserId(userId: string): CloudFile[] {
    const files = MockDB.getCollection('cloudFiles') || [];
    return files.filter(f => f.userId === userId);
  }

  static create(file: CloudFile): CloudFile {
    return MockDB.insertOne('cloudFiles', file);
  }

  static findAll(): CloudFile[] {
    return MockDB.getCollection('cloudFiles') || [];
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('cloudFiles', f => f.id === id);
  }
}
