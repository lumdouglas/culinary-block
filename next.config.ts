import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
