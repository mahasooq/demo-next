export type PolygonBounds = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export const DEFAULT_POLYGON: PolygonBounds = {
  minLng: -122.419,
  minLat: 37.774,
  maxLng: -122.409,
  maxLat: 37.784,
};

export function buildPolygonWkt(bounds: PolygonBounds): string {
  const { minLng, minLat, maxLng, maxLat } = bounds;
  return `POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`;
}

export function parsePolygonBounds(
  value: unknown
): PolygonBounds | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const b = value as Record<string, unknown>;
  const minLng = parseCoordinate(b.minLng);
  const minLat = parseCoordinate(b.minLat);
  const maxLng = parseCoordinate(b.maxLng);
  const maxLat = parseCoordinate(b.maxLat);

  if (
    minLng === null ||
    minLat === null ||
    maxLng === null ||
    maxLat === null
  ) {
    return null;
  }

  if (minLng >= maxLng || minLat >= maxLat) {
    return null;
  }

  if (
    minLat < -90 ||
    maxLat > 90 ||
    minLng < -180 ||
    maxLng > 180
  ) {
    return null;
  }

  return { minLng, minLat, maxLng, maxLat };
}

export function parseCoordinate(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}
