import { compare } from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type AppUser = {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  permissions: string[];
};

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        });

        if (!user || !user.passwordHash || user.status !== "active") return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        const roles = user.userRoles.map((ur) => ur.role.name);
        const permissions = Array.from(
          new Set(
            user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.key)),
          ),
        );

        const payload: AppUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          roles,
          permissions,
        };
        return payload;
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        const u = user as AppUser;
        token.id = u.id;
        token.email = u.email;
        token.name = u.name;
        token.roles = u.roles;
        token.permissions = u.permissions;
      }
      return token;
    },
    session: ({ session, token }) => {
      const t = token as {
        id: string;
        email: string;
        name: string | null;
        roles: string[];
        permissions: string[];
      };
      session.user.id = t.id;
      session.user.email = t.email;
      session.user.name = t.name;
      session.user.roles = t.roles;
      session.user.permissions = t.permissions;
      return session;
    },
    authorized: ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isPublic =
        pathname === "/" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/api/auth");

      if (isPublic) return true;
      return isLoggedIn;
    },
  },
  events: {
    signIn: async ({ user }) => {
      if (!user.id) return;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch (err) {
        console.error("[auth] failed to update lastLoginAt", err);
      }
      await writeAudit({
        actorUserId: user.id,
        action: "user.signin",
        entityType: "User",
        entityId: user.id,
      });
    },
    signOut: async (message) => {
      const userId =
        "token" in message && message.token ? (message.token as { id?: string }).id : undefined;
      if (!userId) return;
      await writeAudit({
        actorUserId: userId,
        action: "user.signout",
        entityType: "User",
        entityId: userId,
      });
    },
  },
};
