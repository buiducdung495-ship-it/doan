import { OCRDocument } from '../../types';
import { MockDB } from './MockDB';

export class OCRDocumentModel {
  static findAll(): OCRDocument[] {
    return MockDB.getCollection('ocrDocuments');
  }

  static findById(id: string): OCRDocument | undefined {
    return MockDB.findOne('ocrDocuments', d => d.id === id);
  }

  static create(doc: OCRDocument): OCRDocument {
    return MockDB.insertOne('ocrDocuments', doc);
  }

  static update(id: string, updateData: Partial<OCRDocument>): boolean {
    return MockDB.updateOne('ocrDocuments', d => d.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('ocrDocuments', d => d.id === id);
  }
}
