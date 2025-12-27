// ===========================================
// Node.js API - Express Type Extensions
// ===========================================

import { Request as ExpressRequest } from "express";

export interface AuthenticatedUser {
  id: string;
  githubUserId: number;
  username: string;
  email?: string;
  avatarUrl?: string;
}

export interface AuthenticatedRequest extends ExpressRequest {
  user?: AuthenticatedUser;
  orgId?: string;
  orgRole?: string;
  repoId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface WebhookPayload {
  action: string;
  sender?: {
    id: number;
    login: string;
    avatar_url: string;
  };
  installation?: {
    id: number;
    account: {
      id: number;
      login: string;
      type: string;
      avatar_url: string;
    };
  };
  repository?: {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
      id: number;
      login: string;
    };
  };
  pull_request?: {
    id: number;
    number: number;
    title: string;
    body?: string;
    state: string;
    draft: boolean;
    head: {
      sha: string;
      ref: string;
      repo?: {
        id: number;
        fork: boolean;
      };
    };
    base: {
      sha: string;
      ref: string;
    };
    user: {
      id: number;
      login: string;
    };
    changed_files: number;
    additions: number;
    deletions: number;
  };
}

export type RunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";
export type RunMode = "active" | "shadow" | "disabled";
export type MemberRole = "owner" | "maintainer" | "reviewer" | "viewer";
export type Severity = "block" | "high" | "medium" | "low";
export type FindingSource = "static" | "ai";
export type FindingCategory =
  | "security"
  | "bug"
  | "perf"
  | "style"
  | "maintainability";
