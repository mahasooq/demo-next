import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildPolygonWkt,
  DEFAULT_POLYGON,
  parseCoordinate,
  parsePolygonBounds,
} from "@/lib/geofence";

type GeofenceBody = {
  lat?: unknown;
  lng?: unknown;
  polygon?: unknown;
};

export async function POST(request: NextRequest) {
  let body: GeofenceBody;
  try {
    body = (await request.json()) as GeofenceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const lat = parseCoordinate(body.lat);
  const lng = parseCoordinate(body.lng);

  if (lat === null || lng === null) {
    return NextResponse.json(
      { error: "Body must include numeric lat and lng" },
      { status: 400 }
    );
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: "lat must be [-90, 90] and lng must be [-180, 180]" },
      { status: 400 }
    );
  }

  const polygon =
    body.polygon === undefined
      ? DEFAULT_POLYGON
      : parsePolygonBounds(body.polygon);

  if (!polygon) {
    return NextResponse.json(
      {
        error:
          "polygon must include minLng, minLat, maxLng, maxLat with min < max",
      },
      { status: 400 }
    );
  }

  const wkt = buildPolygonWkt(polygon);

  const rows = await prisma.$queryRaw<{ inside: boolean }[]>`
    SELECT ST_Contains(
      ST_GeomFromText(${wkt}, 4326),
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    ) AS inside
  `;

  const inside = rows[0]?.inside ?? false;
  const responseBody = { inside, lat, lng, polygon };

  console.log(
    "[geofence] POST /api/geofence",
    JSON.stringify({ lat, lng, polygon, inside })
  );

  return NextResponse.json(responseBody);
}
