import { InternalDocument } from '../../types';
import { MockDB } from './MockDB';

export class InternalDocumentModel {
  static findAll(): InternalDocument[] {
    return MockDB.getCollection('internalDocuments');
  }

  static findById(id: string): InternalDocument | undefined {
    return MockDB.findOne('internalDocuments', d => d.id === id);
  }

  static create(doc: InternalDocument): InternalDocument {
    return MockDB.insertOne('internalDocuments', doc);
  }

  static update(id: string, updateData: Partial<InternalDocument>): boolean {
    return MockDB.updateOne('internalDocuments', d => d.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('internalDocuments', d => d.id === id);
  }
}
