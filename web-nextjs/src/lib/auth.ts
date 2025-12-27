// ===========================================
// Next.js - NextAuth Configuration
// ===========================================

import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        // First sign in - exchange code with our backend
        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
          console.log(
            "JWT Callback: Exchanging token with backend at:",
            apiUrl
          );

          const response = await fetch(`${apiUrl}/api/auth/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: account.access_token }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("JWT Callback: Successfully exchanged token");
            token.accessToken = data.token;
            token.userId = data.user.id;
          } else {
            const errorText = await response.text();
            console.error(
              "JWT Callback: Backend exchange failed:",
              response.status,
              errorText
            );
          }
        } catch (error) {
          console.error(
            "JWT Callback: Failed to exchange token with backend:",
            error
          );
        }

        token.githubAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        userId: token.userId as string,
        user: {
          ...session.user,
          id: token.userId as string,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};

// Type augmentations
declare module "next-auth" {
  interface Session {
    accessToken: string;
    userId: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    userId?: string;
    githubAccessToken?: string;
  }
}
