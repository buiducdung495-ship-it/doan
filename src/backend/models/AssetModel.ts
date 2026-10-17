import { MockDB } from './MockDB';
import { Asset } from '../../types';

export class AssetModel {
  static findById(id: string): Asset | undefined {
    return MockDB.findOne('assets', a => a.id === id);
  }

  static findAll(): Asset[] {
    return MockDB.getCollection('assets');
  }

  static findAssignedTo(userId: string): Asset[] {
    return MockDB.find('assets', a => a.assignedTo === userId);
  }

  static create(asset: Asset): Asset {
    return MockDB.insertOne('assets', asset);
  }

  static update(id: string, updateData: Partial<Asset>): boolean {
    return MockDB.updateOne('assets', a => a.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('assets', a => a.id === id);
  }
}
