import Link from "next/link";
import { getApexOrigin, tenantLabel, tenantUrl } from "@/lib/app-domain";

const tenantSlugs = [
  { subdomain: "acme", note: "tenant_acme" },
  { subdomain: "beta", note: "tenant_beta" },
  { subdomain: "unknown", note: "404", danger: true },
] as const;

export default function Home() {
  const apex = getApexOrigin();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Feature demos</h1>
        <p>
          Three minimal proofs in one App Router project: subdomain tenants,
          PostGIS geofence checks, and cross-tab Socket.io updates.
        </p>
      </header>

      <div className="demo-grid">
        <section className="card card-wide">
          <h2>Multi-tenant middleware</h2>
          <p>
            Subdomain is read from the Host header, resolved against a mock Redis
            store, and injected as <code>x-tenant-id</code>.
            Unknown subdomains return 404.
          </p>
          <ul className="demo-list" style={{ marginTop: "1rem" }}>
            {tenantSlugs.map((t) => (
              <li key={t.subdomain}>
                <a
                  href={tenantUrl(t.subdomain)}
                  className={"danger" in t && t.danger ? "is-danger" : undefined}
                >
                  <span>{tenantLabel(t.subdomain)}</span>
                  <span>{t.note}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="hint" style={{ marginTop: "1rem" }}>
            Also open <Link href="/tenant">/tenant</Link> on the apex host (
            <a href={`${apex}/tenant`}>{apex}/tenant</a>) to see the no-tenant
            state.
          </p>
        </section>

        <section className="card">
          <h2>PostGIS geofence</h2>
          <p>
            POST coordinates to <code>/api/geofence</code> with a raw{" "}
            <code>ST_Contains</code> query via Prisma.
          </p>
          <ul className="demo-list" style={{ marginTop: "1rem" }}>
            <li>
              <Link href="/geofence">
                <span>Open geofence UI</span>
                <span>/geofence</span>
              </Link>
            </li>
          </ul>
        </section>

        <section className="card">
          <h2>Socket.io realtime</h2>
          <p>
            Custom <code>server.js</code> shares HTTP with
            Next.js. Increment in one tab; others update in under 500ms.
          </p>
          <ul className="demo-list" style={{ marginTop: "1rem" }}>
            <li>
              <Link href="/realtime">
                <span>Open counter demo</span>
                <span>/realtime</span>
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
