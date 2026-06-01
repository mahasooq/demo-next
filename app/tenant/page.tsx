import { headers } from "next/headers";
import Link from "next/link";
import { getApexOrigin, getAppDomain, tenantUrl } from "@/lib/app-domain";

export default function TenantPage() {
  const headerList = headers();
  const tenantId = headerList.get("x-tenant-id");
  const tenantName = headerList.get("x-tenant-name");
  const apex = getApexOrigin();
  const domain = getAppDomain();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Tenant middleware</h1>
        <p>
          Server component reads injected headers set by middleware after mock
          Redis lookup. Apex domain: <code>{domain}</code>
        </p>
      </header>

      {!tenantId ? (
        <section className="card">
          <div className="empty-state">
            No tenant on this host (apex). Try a tenant subdomain, e.g.{" "}
            <a href={tenantUrl("acme")}>{tenantUrl("acme")}</a>, or return{" "}
            <Link href="/">home</Link> or{" "}
            <a href={`${apex}/tenant`}>{apex}/tenant</a>.
          </div>
        </section>
      ) : (
        <section className="card">
          <span className="badge badge-success">Tenant resolved</span>
          <div className="kv-grid" style={{ marginTop: "1.25rem" }}>
            <div className="kv">
              <span className="kv-label">x-tenant-id</span>
              <span className="kv-value">{tenantId}</span>
            </div>
            <div className="kv">
              <span className="kv-label">x-tenant-name</span>
              <span className="kv-value">{tenantName}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
