declare module "next-auth/react" {
  import type { Session } from "next-auth";
  import type { ReactElement, ReactNode } from "react";

  type Status = "loading" | "authenticated" | "unauthenticated";

  export function useSession(): {
    data: Session | null;
    status: Status;
    update: (data?: Partial<Session>) => Promise<Session | null>;
  };

  export function signIn(provider?: string, options?: Record<string, unknown>): Promise<void>;

  export function signOut(options?: Record<string, unknown>): Promise<void>;

  export interface SessionProviderProps {
    children: ReactNode;
    session?: Session | null;
  }

  export function SessionProvider(props: SessionProviderProps): ReactElement;
}
