import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { userRepository } from "@/lib/repositories/users";
import { authLogger } from "@/lib/logger";

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
        const startTime = Date.now();
        
        try {
          if (!credentials?.email || !credentials?.password) {
            authLogger.warn('Login attempt with missing credentials');
            throw new Error("Please provide both email and password");
          }

          authLogger.info('Login attempt', { 
            email: credentials.email.toLowerCase(),
            rememberMe: credentials.rememberMe === "true"
          });

          const user = await userRepository.findByEmailWithPassword(credentials.email);

          if (!user) {
            authLogger.warn('Login failed: user not found', { 
              email: credentials.email.toLowerCase(),
              duration: Date.now() - startTime
            });
            // Don't reveal whether the email exists
            throw new Error("Invalid email or password");
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            authLogger.warn('Login failed: invalid password', { 
              email: credentials.email.toLowerCase(),
              userId: user.id,
              duration: Date.now() - startTime
            });
            throw new Error("Invalid email or password");
          }

          authLogger.info('Login successful', {
            email: user.email,
            userId: user.id,
            role: user.role,
            duration: Date.now() - startTime
          });

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            rememberMe: credentials.rememberMe === "true"
          };
        } catch (error) {
          authLogger.error('Authentication error', error, {
            email: credentials?.email?.toLowerCase(),
            duration: Date.now() - startTime
          });
          // Return null to trigger the error page with CredentialsSignin error
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days default
    updateAge: 24 * 60 * 60, // 24 hours - session will be extended when used
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        
        authLogger.debug('Session created/updated', {
          userId: token.id,
          email: session.user.email,
          role: token.role
        });
      }
      return session;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        
        authLogger.debug('JWT token created', {
          userId: user.id,
          email: user.email,
          trigger
        });
        
        // Store remember me preference temporarily
        if ('rememberMe' in user) {
          const globalObj = globalThis as unknown as { __rememberMe?: Record<string, boolean> };
          if (!globalObj.__rememberMe) {
            globalObj.__rememberMe = {};
          }
          globalObj.__rememberMe[user.id as string] = user.rememberMe as boolean;
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