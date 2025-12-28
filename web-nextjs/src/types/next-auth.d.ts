import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    userId: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface AuthOptions {
    trustHost?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    userId?: string;
    githubAccessToken?: string;
  }
}
