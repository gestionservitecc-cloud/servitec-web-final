import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedAdminEmail } from "@/lib/admin-access";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return false;
      const googleProfile = profile as { email_verified?: boolean } | undefined;
      return Boolean(
        googleProfile?.email_verified === true &&
          isAllowedAdminEmail(user.email),
      );
    },
    async jwt({ token }) {
      token.isAdmin = isAllowedAdminEmail(token.email);
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email || null;
      }
      return session;
    },
  },
  pages: { signIn: "/admin" },
});
