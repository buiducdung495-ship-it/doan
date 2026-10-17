import { IncomingDocument } from '../../types';
import { MockDB } from './MockDB';

export class IncomingDocumentModel {
  static findAll(): IncomingDocument[] {
    return MockDB.getCollection('incomingDocuments');
  }

  static findById(id: string): IncomingDocument | undefined {
    return MockDB.findOne('incomingDocuments', d => d.id === id);
  }

  static create(doc: IncomingDocument): IncomingDocument {
    return MockDB.insertOne('incomingDocuments', doc);
  }

  static update(id: string, updateData: Partial<IncomingDocument>): boolean {
    return MockDB.updateOne('incomingDocuments', d => d.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('incomingDocuments', d => d.id === id);
  }
}
