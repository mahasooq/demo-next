import { NextRequest, NextResponse } from "next/server";
import {
  isBasicAuthValid as isValidHeader,
  UNAUTHORIZED_HEADERS,
} from "./basic-auth-shared";

export function isBasicAuthValid(request: NextRequest): boolean {
  return isValidHeader(request.headers.get("authorization"));
}

export function basicAuthUnauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: UNAUTHORIZED_HEADERS,
  });
}
