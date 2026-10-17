import mongoose from 'mongoose';

const kpiRecordSchema = new mongoose.Schema({
  daysWorked: { type: Number, default: 0 },
  kpiScore: { type: Number, default: 0 },
  note: { type: String, default: '' }
}, { _id: false });

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  secondaryPhoneNumber: { type: String },
  role: { type: String, enum: ['admin', 'manager', 'employee'], required: true },
  department: { type: String, enum: ['Tech', 'HR', 'Finance', 'Sales', 'Admin'], required: true },
  avatar: { type: String },
  salary: { type: Number },
  realName: { type: String },
  cccd: { type: String },
  address: { type: String },
  position: { type: String },
  gender: { type: String, enum: ['Nam', 'Nữ'] },
  birthday: { type: String },
  age: { type: Number },
  level: { type: String },
  cloudUsed: { type: Number, default: 0 },
  kpiRecords: {
    type: Map,
    of: kpiRecordSchema
  },
  signatureUrl: { type: String }
}, { timestamps: true });

export const MongoUserModel = mongoose.model('User', userSchema);
