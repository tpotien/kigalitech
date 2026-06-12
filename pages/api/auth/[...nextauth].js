import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

const ok = (val) => val && !val.includes('placeholder');

const providers = [];

if (ok(process.env.GOOGLE_CLIENT_ID) && ok(process.env.GOOGLE_CLIENT_SECRET)) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: false,
  }));
}

if (ok(process.env.FACEBOOK_CLIENT_ID) && ok(process.env.FACEBOOK_CLIENT_SECRET)) {
  providers.push(FacebookProvider({
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: false,
  }));
}

if (ok(process.env.APPLE_ID) && ok(process.env.APPLE_SECRET)) {
  providers.push(AppleProvider({
    clientId: process.env.APPLE_ID,
    clientSecret: process.env.APPLE_SECRET,
    allowDangerousEmailAccountLinking: false,
  }));
}

providers.push(CredentialsProvider({
  name: 'Credentials',
  credentials: {
    email: { label: 'Email or Phone', type: 'text' },
    password: { label: 'Password', type: 'password' },
    magicOtp: { label: 'Magic OTP', type: 'text' },
  },
  async authorize(credentials) {
    if (!credentials?.email) return null;

    const input = credentials.email.trim().toLowerCase();

    // Magic link OTP path — one-time code from /api/auth/magic-verify
    if (credentials.magicOtp) {
      const record = await prisma.verificationToken.findFirst({
        where: { identifier: `otp:${input}`, token: credentials.magicOtp },
      });
      if (!record || record.expires < new Date()) {
        console.error('[nextauth] magic OTP not found or expired for', input);
        return null;
      }
      await prisma.verificationToken.deleteMany({
        where: { identifier: `otp:${input}` },
      });
      const user = await prisma.user.findUnique({ where: { email: input } });
      if (!user) { console.error('[nextauth] user not found for', input); return null; }
      return user;
    }

    if (!credentials.password) return null;

    const adminPwd = process.env.ADMIN_PASSWORD || '';
    const adminPwdMatch = adminPwd.startsWith('$2')
      ? await bcrypt.compare(credentials.password, adminPwd)
      : credentials.password === adminPwd;
    if (
      process.env.ADMIN_EMAIL && adminPwd &&
      input === process.env.ADMIN_EMAIL &&
      adminPwdMatch
    ) {
      let user = await prisma.user.findUnique({ where: { email: input } });
      if (!user) {
        user = await prisma.user.create({ data: { email: input, name: 'Admin', role: 'admin', emailVerified: new Date() } });
      } else if (user.role !== 'admin') {
        user = await prisma.user.update({ where: { id: user.id }, data: { role: 'admin', emailVerified: user.emailVerified || new Date() } });
      }
      return user;
    }

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

export const authOptions = {
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
      // Admin role is only valid for the authorised email — downgrade anyone else
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kigalitechservices@gmail.com';
      if (token.role === 'admin' && token.email !== ADMIN_EMAIL) {
        token.role = 'user';
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
};

export default NextAuth(authOptions);
