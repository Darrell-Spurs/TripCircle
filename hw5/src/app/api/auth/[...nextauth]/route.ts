import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

async function buildHandler() {
  const [{ default: NextAuth }, { authOptions }] = await Promise.all([
    import("next-auth"),
    import("@/lib/auth/options"),
  ]);

  return NextAuth(authOptions);
}

type AuthHandler = Awaited<ReturnType<typeof buildHandler>>;

async function handler(request: NextRequest, context: Parameters<AuthHandler>[1]) {
  const authHandler = await buildHandler();
  return authHandler(request, context);
}

export { handler as GET, handler as POST };
