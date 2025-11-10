declare module "next-auth/react" {
  import type { Session } from "next-auth";
  import type { ReactElement, ReactNode } from "react";

  type Status = "loading" | "authenticated" | "unauthenticated";

  export interface ClientSafeProvider {
    id: string;
    name: string;
    type: string;
    signinUrl: string;
    callbackUrl: string;
  }

  export function useSession(): {
    data: Session | null;
    status: Status;
    update: (data?: Partial<Session>) => Promise<Session | null>;
  };

  export function signIn(provider?: string, options?: Record<string, unknown>): Promise<void>;

  export function signOut(options?: Record<string, unknown>): Promise<void>;

  export function getProviders(): Promise<Record<string, ClientSafeProvider> | null>;

  export interface SessionProviderProps {
    children: ReactNode;
    session?: Session | null;
  }

  export function SessionProvider(props: SessionProviderProps): ReactElement;
}
