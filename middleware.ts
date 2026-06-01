import { NextRequest, NextResponse } from "next/server";
import { getAppDomain } from "@/lib/app-domain";
import { basicAuthUnauthorized, isBasicAuthValid } from "@/lib/basic-auth";
import { parseHost } from "@/lib/subdomain";
import { getTenantBySubdomain } from "@/lib/tenant-store";

const ROOT_DOMAIN = getAppDomain();

export async function middleware(request: NextRequest) {
  if (!isBasicAuthValid(request)) {
    return basicAuthUnauthorized();
  }

  const host = request.headers.get("host");
  const parsed = parseHost(host, ROOT_DOMAIN);

  if (parsed.type === "apex" || parsed.type === "invalid") {
    return NextResponse.next();
  }

  const tenant = await getTenantBySubdomain(parsed.subdomain);
  if (!tenant) {
    return new NextResponse("Tenant not found", { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", tenant.tenantId);
  requestHeaders.set("x-tenant-name", tenant.name);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
