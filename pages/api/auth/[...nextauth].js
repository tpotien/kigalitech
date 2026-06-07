import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

const providers = [];

providers.push(CredentialsProvider({
  name: 'Credentials',
  credentials: {
    email: { label: 'Email or Phone', type: 'text' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) return null;

    const input = credentials.email.trim().toLowerCase();

    // Check for env-configured admin (no hardcoded fallbacks)
    if (
      process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD &&
      input === process.env.ADMIN_EMAIL &&
      credentials.password === process.env.ADMIN_PASSWORD
    ) {
      let user = await prisma.user.findUnique({ where: { email: input } });
      if (!user) {
        user = await prisma.user.create({ data: { email: input, name: 'Admin', role: 'admin', emailVerified: new Date() } });
      } else if (user.role !== 'admin') {
        user = await prisma.user.update({ where: { id: user.id }, data: { role: 'admin', emailVerified: user.emailVerified || new Date() } });
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
        user = await prisma.user.findUnique({ where: { email: `${input.replace(/\D/g, '')}@phone.kigalitech.com` } });
      }
    }

    if (!user || !user.password) return null;
    const valid = await bcrypt.compare(credentials.password, user.password);
    if (!valid) return null;

    const isPhoneAccount = user.email?.endsWith('@phone.kigalitech.com');
    if (!user.emailVerified && !isPhoneAccount && !user.mustChangePassword) {
      throw new Error('VERIFY:' + user.email);
    }
    return user;
  },
}));

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.language = user.language;
        token.mustChangePassword = user.mustChangePassword || false;
        token.emailVerified = user.emailVerified ? true : false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.language = token.language;
        session.user.mustChangePassword = token.mustChangePassword || false;
        session.user.emailVerified = token.emailVerified || false;
      }
      if (token?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.id) },
            select: { name: true, image: true, emailVerified: true },
          });
          if (dbUser) {
            if (dbUser.name) session.user.name = dbUser.name;
            if (dbUser.image) session.user.image = dbUser.image;
            session.user.emailVerified = dbUser.emailVerified ? true : false;
          }
        } catch {}
      }
      return session;
    },
  },
});
