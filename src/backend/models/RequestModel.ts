import { MockDB } from './MockDB';
import { WorkflowRequest } from '../../types';

export class RequestModel {
  static findById(id: string): WorkflowRequest | undefined {
    return MockDB.findOne('requests', r => r.id === id);
  }

  static findAll(): WorkflowRequest[] {
    return MockDB.getCollection('requests');
  }

  static findBySubmitter(submitterId: string): WorkflowRequest[] {
    return MockDB.find('requests', r => r.submitterId === submitterId);
  }

  static create(request: WorkflowRequest): WorkflowRequest {
    return MockDB.insertOne('requests', request);
  }

  static update(id: string, updateData: Partial<WorkflowRequest>): boolean {
    return MockDB.updateOne('requests', r => r.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('requests', r => r.id === id);
  }
}
