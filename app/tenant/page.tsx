import { headers } from "next/headers";
import Link from "next/link";

export default function TenantPage() {
  const headerList = headers();
  const tenantId = headerList.get("x-tenant-id");
  const tenantName = headerList.get("x-tenant-name");

  return (
    <div className="page">
      <header className="page-header">
        <h1>Tenant middleware</h1>
        <p>
          Server component reads injected headers set by middleware after mock
          Redis lookup.
        </p>
      </header>

      {!tenantId ? (
        <section className="card">
          <div className="empty-state">
            No tenant on this host. Try a seeded subdomain, e.g.{" "}
            <a href="http://acme.localhost:3000/tenant">
              acme.localhost:3000/tenant
            </a>
            , or return <Link href="/">home</Link>.
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
