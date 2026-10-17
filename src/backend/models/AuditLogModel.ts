import { AuditLog } from '../../types';
import { MockDB } from './MockDB';

export class AuditLogModel {
  static findAll(): AuditLog[] {
    return MockDB.getCollection('auditLogs');
  }

  static create(log: AuditLog): AuditLog {
    return MockDB.insertOne('auditLogs', log);
  }
}
