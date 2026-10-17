import { MockDB } from './MockDB';
import { User } from '../../types';
import { MongoUserModel } from './MongoUserModel';
import mongoose from 'mongoose';

export class UserModel {
  static async findById(id: string): Promise<User | undefined> {
    if (mongoose.connection.readyState === 1) {
      const user = await MongoUserModel.findOne({ id }).lean();
      return user ? (user as any as User) : undefined;
    }
    return MockDB.findOne('users', u => u.id === id);
  }

  static async findByEmail(email: string): Promise<User | undefined> {
    if (mongoose.connection.readyState === 1) {
      const user = await MongoUserModel.findOne({ email: new RegExp(`^${email}$`, 'i') }).lean();
      return user ? (user as any as User) : undefined;
    }
    return MockDB.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  }

  static async findByEmailOrPhoneAndId(identifier: string, employeeId: string): Promise<User | undefined> {
    if (mongoose.connection.readyState === 1) {
      const user = await MongoUserModel.findOne({
        id: new RegExp(`^${employeeId}$`, 'i'),
        $or: [
          { email: new RegExp(`^${identifier}$`, 'i') },
          { phoneNumber: identifier }
        ]
      }).lean();
      return user ? (user as any as User) : undefined;
    }
    return MockDB.findOne('users', u => {
      const isEmailMatch = u.email && u.email.toLowerCase() === identifier.toLowerCase();
      const isPhoneMatch = u.phoneNumber && u.phoneNumber === identifier;
      const isIdMatch = u.id && u.id.toLowerCase() === employeeId.toLowerCase();
      return (isEmailMatch || isPhoneMatch) && isIdMatch;
    });
  }

  static async create(user: User): Promise<User> {
    if (mongoose.connection.readyState === 1) {
      const created = await MongoUserModel.create(user);
      return created.toObject() as any as User;
    }
    return MockDB.insertOne('users', user);
  }

  static async findAll(): Promise<User[]> {
    if (mongoose.connection.readyState === 1) {
      const users = await MongoUserModel.find({}).lean();
      return users as any as User[];
    }
    return MockDB.getCollection('users');
  }

  static async update(id: string, updateData: Partial<User>): Promise<boolean> {
    if (mongoose.connection.readyState === 1) {
      const res = await MongoUserModel.updateOne({ id }, { $set: updateData });
      return res.modifiedCount > 0 || res.matchedCount > 0;
    }
    return MockDB.updateOne('users', u => u.id === id, updateData);
  }

  static async delete(id: string): Promise<boolean> {
    if (mongoose.connection.readyState === 1) {
      const res = await MongoUserModel.deleteOne({ id });
      return res.deletedCount > 0;
    }
    return MockDB.deleteOne('users', u => u.id === id);
  }
}
