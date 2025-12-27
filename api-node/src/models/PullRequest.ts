import { Schema, model, Document, Types } from "mongoose";
import { RunMode } from "../types/enums";

export interface IPullRequest extends Document {
  repoId: Types.ObjectId;
  prNumber: number;
  githubPrId?: number;
  title?: string;
  headSha: string;
  headRef?: string;
  baseSha?: string;
  baseRef?: string;
  authorLogin?: string;
  authorId?: number;
  state: string;
  isDraft: boolean;
  isFromFork: boolean;
  additions: number;
  deletions: number;
  changedFiles: number;
  runMode: RunMode;
  lastWebhookAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pullRequestSchema = new Schema<IPullRequest>(
  {
    repoId: {
      type: Schema.Types.ObjectId,
      ref: "Repository",
      required: true,
      index: true,
    },
    prNumber: { type: Number, required: true },
    githubPrId: { type: Number },
    title: { type: String },
    headSha: { type: String, required: true, index: true },
    headRef: { type: String },
    baseSha: { type: String },
    baseRef: { type: String },
    authorLogin: { type: String, index: true },
    authorId: { type: Number },
    state: { type: String, default: "open" },
    isDraft: { type: Boolean, default: false },
    isFromFork: { type: Boolean, default: false },
    additions: { type: Number, default: 0 },
    deletions: { type: Number, default: 0 },
    changedFiles: { type: Number, default: 0 },
    runMode: {
      type: String,
      enum: Object.values(RunMode),
      default: RunMode.ACTIVE,
    },
    lastWebhookAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

pullRequestSchema.index({ repoId: 1, prNumber: 1 }, { unique: true });

export const PullRequest = model<IPullRequest>(
  "PullRequest",
  pullRequestSchema
);
