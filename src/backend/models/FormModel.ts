import { MockDB } from './MockDB';
import { FormTemplate } from '../../types';

export class FormModel {
  static findById(id: string): FormTemplate | undefined {
    return MockDB.findOne('forms', f => f.id === id);
  }

  static findAll(): FormTemplate[] {
    return MockDB.getCollection('forms');
  }

  static create(form: FormTemplate): FormTemplate {
    return MockDB.insertOne('forms', form);
  }

  static update(id: string, updateData: Partial<FormTemplate>): boolean {
    return MockDB.updateOne('forms', f => f.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('forms', f => f.id === id);
  }
}
