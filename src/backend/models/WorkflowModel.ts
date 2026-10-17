import { MockDB } from './MockDB';
import { WorkflowConfig } from '../../types';

export class WorkflowModel {
  static findById(id: string): WorkflowConfig | undefined {
    return MockDB.findOne('workflows', w => w.id === id);
  }

  static findByFormTemplateId(formTemplateId: string): WorkflowConfig | undefined {
    return MockDB.findOne('workflows', w => w.formTemplateId === formTemplateId);
  }

  static findAll(): WorkflowConfig[] {
    return MockDB.getCollection('workflows');
  }

  static create(workflow: WorkflowConfig): WorkflowConfig {
    return MockDB.insertOne('workflows', workflow);
  }

  static update(id: string, updateData: Partial<WorkflowConfig>): boolean {
    return MockDB.updateOne('workflows', w => w.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('workflows', w => w.id === id);
  }
}
