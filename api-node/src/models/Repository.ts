import { Schema, model, Document, Types } from "mongoose";
import { RunMode } from "../types/enums";

export interface IRepository extends Document {
  orgId: Types.ObjectId;
  githubRepoId: number;
  name: string;
  fullName: string;
  description?: string;
  defaultBranch: string;
  language?: string;
  isPrivate: boolean;
  isEnabled: boolean;
  webhookId?: number;
  lastSyncedAt?: Date;
  config: {
    maxComments: number;
    minSeverity: "block" | "high" | "medium" | "low";
    shadowMode: boolean;
    runMode: RunMode;
    enableStatic: boolean;
    enableAi: boolean;
    aiMode: "balanced" | "strict" | "security" | "performance";
    aiModelOverride?: string;
    excludedPaths: string[];
    excludedFilePatterns: string[];
    maxFileSizeKb: number;
    maxPrFiles: number;
    maxPrLines: number;
    enabledRules: string[];
    disabledRules: string[];
    customRules: any[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const repositorySchema = new Schema<IRepository>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    githubRepoId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    fullName: { type: String, required: true, index: true },
    description: { type: String },
    defaultBranch: { type: String, default: "main" },
    language: { type: String },
    isPrivate: { type: Boolean, default: false },
    isEnabled: { type: Boolean, default: false, index: true },
    webhookId: { type: Number },
    lastSyncedAt: { type: Date },
    config: {
      maxComments: { type: Number, default: 10 },
      minSeverity: {
        type: String,
        enum: ["block", "high", "medium", "low"],
        default: "low",
      },
      shadowMode: { type: Boolean, default: true },
      runMode: {
        type: String,
        enum: Object.values(RunMode),
        default: RunMode.SHADOW,
      },
      enableStatic: { type: Boolean, default: true },
      enableAi: { type: Boolean, default: true },
      aiMode: {
        type: String,
        enum: ["balanced", "strict", "security", "performance"],
        default: "balanced",
      },
      aiModelOverride: { type: String },
      excludedPaths: { type: [String], default: [] },
      excludedFilePatterns: {
        type: [String],
        default: [
          "*.lock",
          "*.min.js",
          "*.min.css",
          "package-lock.json",
          "yarn.lock",
        ],
      },
      maxFileSizeKb: { type: Number, default: 500 },
      maxPrFiles: { type: Number, default: 100 },
      maxPrLines: { type: Number, default: 5000 },
      enabledRules: { type: [String], default: [] },
      disabledRules: { type: [String], default: [] },
      customRules: { type: [Schema.Types.Mixed], default: [] },
    },
  },
  {
    timestamps: true,
  }
);

export const Repository = model<IRepository>("Repository", repositorySchema);
