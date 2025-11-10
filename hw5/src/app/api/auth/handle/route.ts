import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  handle: z
    .string()
    .trim()
    .min(1, "Handle is required")
    .max(16, "Handle must be at most 16 characters")
    .regex(/^[A-Za-z0-9]+$/, "Handle must be alphanumeric"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid handle" },
      { status: 400 },
    );
  }

  const { handle } = parsed.data;

  const existingHandle = await prisma.user.findUnique({
    where: { handle },
    select: { id: true },
  });

  if (existingHandle) {
    return NextResponse.json({ message: "Handle already taken" }, { status: 409 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, name: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      handle,
      displayName: existingUser?.displayName?.length
        ? existingUser.displayName
        : handle,
      name: existingUser?.name ?? handle,
    },
  });

  return NextResponse.json({ status: "ok" });
}
