import { MockDB } from './MockDB';
import { PaymentTransaction } from '../../types';

export class PaymentModel {
  static findAll(): PaymentTransaction[] {
    return MockDB.getCollection('payments');
  }

  static findByUserId(userId: string): PaymentTransaction[] {
    return MockDB.find('payments', p => p.userId === userId);
  }

  static create(transaction: PaymentTransaction): PaymentTransaction {
    return MockDB.insertOne('payments', transaction);
  }
}
