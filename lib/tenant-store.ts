export type Tenant = {
  tenantId: string;
  name: string;
};

/** Mock Redis: GET tenant:{subdomain} */
const tenants = new Map<string, Tenant>([
  ["acme", { tenantId: "tenant_acme", name: "Acme" }],
  ["beta", { tenantId: "tenant_beta", name: "Beta Inc" }],
]);

export async function getTenantBySubdomain(
  subdomain: string
): Promise<Tenant | null> {
  return tenants.get(subdomain.toLowerCase()) ?? null;
}
