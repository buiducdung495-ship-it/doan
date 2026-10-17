import { SharedCategory } from '../../types';
import { MockDB } from './MockDB';

export class SharedCategoryModel {
  static findAll(): SharedCategory[] {
    return MockDB.getCollection('sharedCategories');
  }

  static findById(id: string): SharedCategory | undefined {
    return MockDB.findOne('sharedCategories', c => c.id === id);
  }

  static create(cat: SharedCategory): SharedCategory {
    return MockDB.insertOne('sharedCategories', cat);
  }

  static update(id: string, updateData: Partial<SharedCategory>): boolean {
    return MockDB.updateOne('sharedCategories', c => c.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('sharedCategories', c => c.id === id);
  }
}
