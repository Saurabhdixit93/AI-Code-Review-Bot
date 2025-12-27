import { Schema, model, Document, Types } from "mongoose";
import {
  FindingSource,
  FindingCategory,
  FindingSeverity,
  FindingConfidence,
} from "../types/enums";

export interface IFinding extends Document {
  runId: Types.ObjectId;
  prId: Types.ObjectId;
  repoId: Types.ObjectId;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  source: FindingSource;
  category: FindingCategory;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  title: string;
  message: string;
  suggestion?: string;
  diffHunk?: string;
  ruleId?: string;
  suppressed: boolean;
  suppressionReason?: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

const findingSchema = new Schema<IFinding>(
  {
    runId: {
      type: Schema.Types.ObjectId,
      ref: "Run",
      required: true,
      index: true,
    },
    prId: {
      type: Schema.Types.ObjectId,
      ref: "PullRequest",
      required: true,
      index: true,
    },
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    filePath: { type: String, required: true },
    lineStart: { type: Number, required: true },
    lineEnd: { type: Number, required: true },
    source: {
      type: String,
      enum: Object.values(FindingSource),
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(FindingCategory),
      required: true,
    },
    severity: {
      type: String,
      enum: Object.values(FindingSeverity),
      required: true,
    },
    confidence: {
      type: String,
      enum: Object.values(FindingConfidence),
      required: true,
    },
    message: { type: String, required: true },
    title: { type: String, required: true },
    suggestion: { type: String },
    diffHunk: { type: String },
    ruleId: { type: String },
    suppressed: { type: Boolean, default: false, index: true },
    suppressionReason: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

findingSchema.index({ repoId: 1, filePath: 1 });

export const Finding = model<IFinding>("Finding", findingSchema);
