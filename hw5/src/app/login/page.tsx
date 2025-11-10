import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { LoginPanel } from "@/components/auth/LoginPanel";
import { authOptions } from "@/lib/auth/options";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.handle) {
    redirect("/");
  }

  const callbackValue = Array.isArray(searchParams?.callbackUrl)
    ? searchParams?.callbackUrl?.[0]
    : (searchParams?.callbackUrl as string | undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <LoginPanel callbackUrl={callbackValue} />
    </div>
  );
}
