import { Schema, model, Document, Types } from "mongoose";
import { MemberRole } from "../types/enums";

export interface IMember extends Document {
  orgId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MemberRole;
  invitedBy?: Types.ObjectId;
  invitedAt?: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(MemberRole),
      default: MemberRole.VIEWER,
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    invitedAt: { type: Date },
    acceptedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

memberSchema.index({ orgId: 1, userId: 1 }, { unique: true });

export const Member = model<IMember>("Member", memberSchema);
