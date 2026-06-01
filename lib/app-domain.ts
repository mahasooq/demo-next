/** Normalize DOMAIN / ROOT_DOMAIN (strip protocol, path, trailing slash). */
export function normalizeDomain(raw: string | undefined): string {
  if (!raw?.trim()) {
    return "localhost:3000";
  }
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function readDomainEnv(): string | undefined {
  if (typeof window === "undefined") {
    return process.env.DOMAIN ?? process.env.ROOT_DOMAIN;
  }
  return (
    process.env.NEXT_PUBLIC_APP_DOMAIN ??
    process.env.NEXT_PUBLIC_DOMAIN
  );
}

/** Apex host for subdomain parsing and links (e.g. demo-next.mahasooq.com or localhost:3000). */
export function getAppDomain(): string {
  return normalizeDomain(readDomainEnv());
}

export function getHostname(domain: string = getAppDomain()): string {
  return domain.split(":")[0];
}

export function isLocalDomain(domain: string = getAppDomain()): boolean {
  const host = getHostname(domain);
  return host === "localhost" || host.endsWith(".localhost");
}

export function getProtocol(domain: string = getAppDomain()): "http" | "https" {
  return isLocalDomain(domain) ? "http" : "https";
}

export function getApexOrigin(domain: string = getAppDomain()): string {
  return `${getProtocol(domain)}://${domain}`;
}

/** Full host for a tenant subdomain (e.g. acme.demo-next.mahasooq.com). */
export function getTenantHost(
  subdomain: string,
  domain: string = getAppDomain()
): string {
  const hostname = getHostname(domain);
  const port = domain.includes(":") ? domain.split(":")[1] : "";
  const host = `${subdomain}.${hostname}`;
  if (port && port !== "80" && port !== "443") {
    return `${host}:${port}`;
  }
  return host;
}

export function tenantUrl(
  subdomain: string,
  path = "/tenant",
  domain: string = getAppDomain()
): string {
  return `${getProtocol(domain)}://${getTenantHost(subdomain, domain)}${path}`;
}

export function tenantLabel(
  subdomain: string,
  domain: string = getAppDomain()
): string {
  return getTenantHost(subdomain, domain);
}
