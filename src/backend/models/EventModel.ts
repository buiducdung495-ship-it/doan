import { Event } from '../../types';
import { MockDB } from './MockDB';

export class EventModel {
  static findAll(): Event[] {
    return MockDB.getCollection('events');
  }

  static findById(id: string): Event | undefined {
    return MockDB.findOne('events', e => e.id === id);
  }

  static create(event: Event): Event {
    return MockDB.insertOne('events', event);
  }

  static update(id: string, updateData: Partial<Event>): boolean {
    return MockDB.updateOne('events', e => e.id === id, updateData);
  }

  static delete(id: string): boolean {
    return MockDB.deleteOne('events', e => e.id === id);
  }
}
