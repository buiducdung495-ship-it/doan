import fs from 'fs';
import path from 'path';

interface DatabaseSchema {
  users: any[];
  forms: any[];
  workflows: any[];
  requests: any[];
  assets: any[];
  chats: any[];
  notifications: any[];
  payments: any[];
  incomingDocuments: any[];
  outgoingDocuments: any[];
  events: any[];
  tasks: any[];
  internalDocuments: any[];
  auditLogs: any[];
  sharedCategories: any[];
  ocrDocuments: any[];
  chatGroups: any[];
  cloudFiles: any[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'db.json');

let memoryDB: DatabaseSchema = {
  users: [],
  forms: [],
  workflows: [],
  requests: [],
  assets: [],
  chats: [],
  notifications: [],
  payments: [],
  incomingDocuments: [],
  outgoingDocuments: [],
  events: [],
  tasks: [],
  internalDocuments: [],
  auditLogs: [],
  sharedCategories: [],
  ocrDocuments: [],
  chatGroups: [],
  cloudFiles: []
};

export class MockDB {
  private static isLoaded = false;

  private static ensureDataDirExists() {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static load(): DatabaseSchema {
    if (this.isLoaded) return memoryDB;

    try {
      this.ensureDataDirExists();
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        memoryDB = { ...memoryDB, ...parsed };
      }
      this.isLoaded = true;
    } catch (err) {
      console.warn('⚠️ Unable to read DB file:', err);
    }
    return memoryDB;
  }

  static save() {
    try {
      this.ensureDataDirExists();
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(memoryDB, null, 2), 'utf-8');
    } catch (err) {
      console.warn('⚠️ Unable to write to DB file:', err);
    }
  }

  static getCollection<K extends keyof DatabaseSchema>(collection: K): DatabaseSchema[K] {
    this.load();
    return memoryDB[collection] || [];
  }

  static find<K extends keyof DatabaseSchema>(
    collection: K,
    predicate: (item: any) => boolean
  ): any[] {
    const col = this.getCollection(collection);
    return col.filter(predicate);
  }

  static findOne<K extends keyof DatabaseSchema>(
    collection: K,
    predicate: (item: any) => boolean
  ): any | undefined {
    const col = this.getCollection(collection);
    return col.find(predicate);
  }

  static insertOne<K extends keyof DatabaseSchema>(
    collection: K,
    item: any
  ): any {
    const col = this.getCollection(collection);
    col.push(item);
    this.save();
    return item;
  }

  static updateOne<K extends keyof DatabaseSchema>(
    collection: K,
    predicate: (item: any) => boolean,
    updates: any
  ): boolean {
    const col = this.getCollection(collection);
    const index = col.findIndex(predicate);
    if (index !== -1) {
      col[index] = { ...col[index], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  static deleteOne<K extends keyof DatabaseSchema>(
    collection: K,
    predicate: (item: any) => boolean
  ): boolean {
    const col = this.getCollection(collection);
    const index = col.findIndex(predicate);
    if (index !== -1) {
      col.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }
}
