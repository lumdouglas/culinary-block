import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-lib uses Node.js internals (Buffer, etc.) that Turbopack can't bundle.
  // Marking it external tells Next.js to use it directly from node_modules.
  serverExternalPackages: ["pdf-lib"],
  /*
    headers: async () => {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self'; img-src 'self' blob: data: https://avuxqlbmckkdkcoydrkx.supabase.co; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://avuxqlbmckkdkcoydrkx.supabase.co;"
            }
          ]
        }
      ]
    }
    */
};

export default nextConfig;
