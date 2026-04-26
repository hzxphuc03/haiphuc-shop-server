import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username?: string;
  email: string;
  password?: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  provider: 'local' | 'google' | 'facebook';
  socialId?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  isDeleted: boolean;
  refreshToken?: string;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  fullName: { type: String },
  phone: { type: String },
  avatar: { type: String },
  provider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
  socialId: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isDeleted: { type: Boolean, default: false },
  refreshToken: { type: String }
}, {
  timestamps: true
});

// Indexes for search
UserSchema.index({ fullName: 'text', email: 'text' });

// Hash password before saving
UserSchema.pre<IUser>('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
