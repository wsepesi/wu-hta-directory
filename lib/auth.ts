import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Please provide both email and password");
          }

          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email.toLowerCase()))
            .limit(1);

          if (!user[0]) {
            // Don't reveal whether the email exists
            throw new Error("Invalid email or password");
          }

          const isPasswordValid = await compare(
            credentials.password,
            user[0].passwordHash
          );

          if (!isPasswordValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user[0].id,
            email: user[0].email,
            firstName: user[0].firstName,
            lastName: user[0].lastName,
            role: user[0].role,
            rememberMe: credentials.rememberMe === "true"
          };
        } catch (error) {
          console.error("Authentication error:", error);
          // Return null to trigger the error page with CredentialsSignin error
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days default
    updateAge: 24 * 60 * 60, // 24 hours - session will be extended when used
  },
  adapter: {
    async createSession({ sessionToken, userId, expires }) {
      // Check if user selected "remember me" - stored temporarily
      const rememberMe = (global as any).__rememberMe?.[userId] || false;
      delete (global as any).__rememberMe?.[userId];
      
      // Set expiry based on remember me choice
      const sessionExpiry = rememberMe 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const session = await db
        .insert(sessions)
        .values({
          sessionToken,
          userId,
          expires: sessionExpiry
        })
        .returning();
      
      return {
        sessionToken: session[0].sessionToken,
        userId: session[0].userId,
        expires: session[0].expires
      };
    },
    async getSessionAndUser(sessionToken) {
      const results = await db
        .select({
          session: sessions,
          user: users
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.sessionToken, sessionToken))
        .limit(1);

      if (!results[0]) {
        return null;
      }

      const { session, user } = results[0];

      return {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: null,
          name: `${user.firstName} ${user.lastName}`,
        }
      };
    },
    async updateSession({ sessionToken, userId, expires }) {
      const updatedSession = await db
        .update(sessions)
        .set({
          expires,
          userId
        })
        .where(eq(sessions.sessionToken, sessionToken))
        .returning();

      if (!updatedSession[0]) {
        return null;
      }

      return {
        sessionToken: updatedSession[0].sessionToken,
        userId: updatedSession[0].userId,
        expires: updatedSession[0].expires
      };
    },
    async deleteSession(sessionToken) {
      await db
        .delete(sessions)
        .where(eq(sessions.sessionToken, sessionToken));
    },
    async createUser(data) {
      // This adapter method is not used with credentials provider
      throw new Error("createUser is not implemented for credentials provider");
    },
    async getUser(id) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user[0]) {
        return null;
      }

      return {
        id: user[0].id,
        email: user[0].email,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        role: user[0].role,
        emailVerified: null,
        name: `${user[0].firstName} ${user[0].lastName}`,
      };
    },
    async getUserByEmail(email) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user[0]) {
        return null;
      }

      return {
        id: user[0].id,
        email: user[0].email,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        role: user[0].role,
        emailVerified: null,
        name: `${user[0].firstName} ${user[0].lastName}`,
      };
    },
    async getUserByAccount({ providerAccountId, provider }) {
      // Not used with credentials provider
      return null;
    },
    async updateUser(data) {
      // This adapter method is not used with credentials provider
      throw new Error("updateUser is not implemented for credentials provider");
    },
    async deleteUser(userId) {
      // This adapter method is not used with credentials provider
      throw new Error("deleteUser is not implemented for credentials provider");
    },
    async linkAccount(account) {
      // Not used with credentials provider
      throw new Error("linkAccount is not implemented for credentials provider");
    },
    async unlinkAccount({ providerAccountId, provider }) {
      // Not used with credentials provider
      throw new Error("unlinkAccount is not implemented for credentials provider");
    },
    async createVerificationToken({ identifier, expires, token }) {
      // Not used with credentials provider
      return null;
    },
    async useVerificationToken({ identifier, token }) {
      // Not used with credentials provider
      return null;
    }
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.firstName = user.firstName;
        session.user.lastName = user.lastName;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        
        // Store remember me preference temporarily
        if ('rememberMe' in user) {
          if (!(global as any).__rememberMe) {
            (global as any).__rememberMe = {};
          }
          (global as any).__rememberMe[user.id] = user.rememberMe;
        }
      }
      return token;
    }
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
};

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    }
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
  }
}