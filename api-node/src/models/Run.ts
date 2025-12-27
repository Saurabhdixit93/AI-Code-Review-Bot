import { Schema, model, Document, Types } from "mongoose";
import { RunMode, RunStatus } from "../types/enums";

export interface IRun extends Document {
  prId: Types.ObjectId;
  status: RunStatus;
  reason?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  tokenCountInput: number;
  tokenCountOutput: number;
  tokenCost: number;
  filesAnalyzed: number;
  linesAnalyzed: number;
  hunksAnalyzed: number;
  findingsTotal: number;
  findingsStatic: number;
  findingsAi: number;
  findingsSuppressed: number;
  aiModelUsed?: string;
  aiTier?: string;
  runMode: RunMode;
  triggeredBy?: string;
  triggerEvent?: any;
  createdAt: Date;
  updatedAt: Date;
}

const runSchema = new Schema<IRun>(
  {
    prId: {
      type: Schema.Types.ObjectId,
      ref: "PullRequest",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(RunStatus),
      default: RunStatus.PENDING,
      index: true,
    },
    reason: { type: String },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationMs: { type: Number },
    tokenCountInput: { type: Number, default: 0 },
    tokenCountOutput: { type: Number, default: 0 },
    tokenCost: { type: Number, default: 0 },
    filesAnalyzed: { type: Number, default: 0 },
    linesAnalyzed: { type: Number, default: 0 },
    hunksAnalyzed: { type: Number, default: 0 },
    findingsTotal: { type: Number, default: 0 },
    findingsStatic: { type: Number, default: 0 },
    findingsAi: { type: Number, default: 0 },
    findingsSuppressed: { type: Number, default: 0 },
    aiModelUsed: { type: String },
    aiTier: { type: String },
    runMode: {
      type: String,
      enum: Object.values(RunMode),
      default: RunMode.ACTIVE,
    },
    triggeredBy: { type: String },
    triggerEvent: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Middleware to update durationMs on completion
runSchema.pre<IRun>("save", function (this: IRun, next) {
  if (
    this.isModified("status") &&
    ["completed", "failed", "skipped"].includes(this.status)
  ) {
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
    if (this.startedAt && this.completedAt) {
      this.durationMs = this.completedAt.getTime() - this.startedAt.getTime();
    }
  }
  next();
});

export const Run = model<IRun>("Run", runSchema);
