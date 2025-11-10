import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { LoginPanel } from "@/components/auth/LoginPanel";
import { authOptions } from "@/lib/auth/options";

type LoginSearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const session = await getServerSession(authOptions);
  
  // If user is logged in and has a handle, redirect to home
  if (session?.user?.handle) {
    redirect("/");
  }
  
  // If user is logged in but doesn't have a handle, redirect to register
  if (session?.user && !session.user.handle) {
    redirect("/register");
  }

  const resolvedParams = await searchParams;
  const rawCallback = resolvedParams?.callbackUrl;
  const callbackValue = Array.isArray(rawCallback)
    ? rawCallback[0]
    : (rawCallback as string | undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <LoginPanel callbackUrl={callbackValue} />
    </div>
  );
}
