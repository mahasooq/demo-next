/** @type {import('next').NextConfig} */
const appDomain =
  process.env.DOMAIN ?? process.env.ROOT_DOMAIN ?? "localhost:3000";

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_DOMAIN: appDomain,
  },
};

export default nextConfig;
