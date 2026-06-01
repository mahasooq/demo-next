"use client";

import { useEffect, useRef } from "react";
import type { PolygonBounds } from "@/lib/geofence";
import "leaflet/dist/leaflet.css";

type Props = {
  polygon: PolygonBounds | null;
  lat: number | null;
  lng: number | null;
  inside: boolean | null;
};

export function GeofenceMap({ polygon, lat, lng, inside }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const rectRef = useRef<import("leaflet").Rectangle | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) {
        return;
      }

      const map = L.map(containerRef.current, { zoomControl: true }).setView(
        [37.779, -122.414],
        14
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapRef.current = map;
      syncLayers(L, map);
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      rectRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    import("leaflet").then((L) => {
      if (mapRef.current) {
        syncLayers(L, mapRef.current);
      }
    });
  }, [polygon, lat, lng, inside]);

  function syncLayers(
    L: typeof import("leaflet"),
    map: import("leaflet").Map
  ) {
    if (rectRef.current) {
      rectRef.current.remove();
      rectRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    const layers: import("leaflet").Layer[] = [];

    if (polygon) {
      const rect = L.rectangle(
        [
          [polygon.minLat, polygon.minLng],
          [polygon.maxLat, polygon.maxLng],
        ],
        {
          color: "#0284c7",
          fillColor: "#0284c7",
          fillOpacity: 0.2,
          weight: 2,
        }
      ).addTo(map);
      rectRef.current = rect;
      layers.push(rect);
    }

    if (lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)) {
      const fill =
        inside === true ? "#059669" : inside === false ? "#dc2626" : "#0284c7";
      const marker = L.circleMarker([lat, lng], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: fill,
        fillOpacity: 0.95,
      }).addTo(map);
      markerRef.current = marker;
      layers.push(marker);
    }

    if (layers.length > 0) {
      const group = L.featureGroup(layers);
      map.fitBounds(group.getBounds().pad(0.25));
    }
  }

  return (
    <div
      ref={containerRef}
      className="geofence-map"
      role="img"
      aria-label="Map showing geofence polygon and check point"
    />
  );
}
