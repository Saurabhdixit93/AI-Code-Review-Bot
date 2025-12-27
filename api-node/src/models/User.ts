import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  githubUserId: number;
  username: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    githubUserId: { type: Number, required: true, unique: true, index: true },
    username: { type: String, required: true, index: true },
    name: { type: String },
    email: { type: String },
    avatarUrl: { type: String },
    accessTokenEncrypted: { type: String },
    refreshTokenEncrypted: { type: String },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>("User", userSchema);
