import { OutgoingDocument } from '../../types';
import { MockDB } from './MockDB';

export class OutgoingDocumentModel {
  static findAll(): OutgoingDocument[] {
    return MockDB.getCollection('outgoingDocuments');
  }

  static findById(id: string): OutgoingDocument | undefined {
    return MockDB.findOne('outgoingDocuments', d => d.id === id);
  }

  static create(doc: OutgoingDocument): OutgoingDocument {
    return MockDB.insertOne('outgoingDocuments', doc);
  }

  static update(id: string, updateData: Partial<OutgoingDocument>): boolean {
    return MockDB.updateOne('outgoingDocuments', d => d.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('outgoingDocuments', d => d.id === id);
  }
}
