import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { HandleForm } from "@/components/auth/HandleForm";
import { authOptions } from "@/lib/auth/options";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user?.handle) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <HandleForm />
    </div>
  );
}
