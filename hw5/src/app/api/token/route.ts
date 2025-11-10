import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { SignJWT } from "jose";

import { authOptions } from "@/lib/auth/options";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Create a simple signed JWT that the backend can verify
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
  
  const token = await new SignJWT({ 
    sub: session.user.id,
    handle: session.user.handle,
    email: session.user.email 
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  return NextResponse.json({ token });
}
