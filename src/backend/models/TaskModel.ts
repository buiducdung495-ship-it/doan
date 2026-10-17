import { Task } from '../../types';
import { MockDB } from './MockDB';

export class TaskModel {
  static findAll(): Task[] {
    return MockDB.getCollection('tasks');
  }

  static findById(id: string): Task | undefined {
    return MockDB.findOne('tasks', t => t.id === id);
  }

  static create(task: Task): Task {
    return MockDB.insertOne('tasks', task);
  }

  static update(id: string, updateData: Partial<Task>): boolean {
    return MockDB.updateOne('tasks', t => t.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('tasks', t => t.id === id);
  }
}
