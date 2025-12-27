import { Schema, model, Document } from "mongoose";

export interface IOrganization extends Document {
  githubOrgId: number;
  name: string;
  slug: string;
  avatarUrl?: string;
  installationId?: number;
  installationStatus: "pending" | "active" | "suspended" | "deleted";
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    githubOrgId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    avatarUrl: { type: String },
    installationId: { type: Number, index: true },
    installationStatus: {
      type: String,
      enum: ["pending", "active", "suspended", "deleted"],
      default: "pending",
    },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

export const Organization = model<IOrganization>(
  "Organization",
  organizationSchema
);
