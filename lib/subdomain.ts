export type HostParseResult =
  | { type: "apex" }
  | { type: "tenant"; subdomain: string }
  | { type: "invalid" };

function hostnameOnly(host: string): string {
  return host.split(":")[0].toLowerCase();
}

export function parseHost(
  host: string | null,
  rootDomain: string
): HostParseResult {
  if (!host) {
    return { type: "invalid" };
  }

  const hostname = hostnameOnly(host);
  const rootHostname = hostnameOnly(rootDomain);

  if (hostname === rootHostname || hostname === `www.${rootHostname}`) {
    return { type: "apex" };
  }

  const suffix = `.${rootHostname}`;
  if (hostname.endsWith(suffix)) {
    const subdomain = hostname.slice(0, -suffix.length);
    if (subdomain && !subdomain.includes(".")) {
      return { type: "tenant", subdomain };
    }
  }

  return { type: "invalid" };
}
