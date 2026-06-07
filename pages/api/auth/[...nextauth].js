import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || 'placeholder',
      clientSecret: process.env.GITHUB_SECRET || 'placeholder',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const input = credentials.email.trim().toLowerCase();

        // Check for hardcoded admin
        if (
          input === (process.env.ADMIN_EMAIL || 'admin@kigalitech.com') &&
          credentials.password === (process.env.ADMIN_PASSWORD || 'admin123')
        ) {
          let user = await prisma.user.findUnique({ where: { email: input } });
          if (!user) {
            user = await prisma.user.create({ data: { email: input, name: 'Admin', role: 'admin' } });
          } else if (user.role !== 'admin') {
            user = await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } });
          }
          return user;
        }

        // Email or phone lookup
        const isPhone = /^\+?[\d\s\-()]{7,}$/.test(input);
        let user;
        if (isPhone) {
          user = await prisma.user.findFirst({ where: { phoneNumber: input } });
        } else {
          user = await prisma.user.findUnique({ where: { email: input } });
          if (!user) {
            // Try phone-converted email
            user = await prisma.user.findUnique({ where: { email: `${input.replace(/\D/g, '')}@phone.kigalitech.com` } });
          }
        }

        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        // Require email verification for email accounts
        const isPhoneAccount = user.email?.endsWith('@phone.kigalitech.com');
        if (!user.emailVerified && !isPhoneAccount) {
          throw new Error('VERIFY:' + user.email);
        }
        return user;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.language = user.language;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.language = token.language;
      }
      // Re-read name and image from DB so profile updates reflect without re-login
      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.id) },
            select: { name: true, image: true },
          });
          if (dbUser) {
            if (dbUser.name) session.user.name = dbUser.name;
            if (dbUser.image) session.user.image = dbUser.image;
          }
        } catch {}
      }
      return session;
    },
  },
});
