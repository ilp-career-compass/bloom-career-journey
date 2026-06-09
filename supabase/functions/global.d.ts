declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  const env: Env;

  interface ServeOptions {
    port?: number;
    hostname?: string;
    onListen?: (params: { port: number; hostname: string }) => void;
    onError?: (error: unknown) => Response | Promise<Response>;
  }

  function serve(
    handler: (request: Request, info: any) => Response | Promise<Response>,
  ): void;
  function serve(
    options: ServeOptions,
    handler: (request: Request, info: any) => Response | Promise<Response>,
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}
