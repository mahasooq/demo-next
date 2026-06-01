"use client";

import { FormEvent, useMemo, useState } from "react";
import { GeofenceMap } from "@/app/geofence/GeofenceMap";
import { DEFAULT_POLYGON, type PolygonBounds } from "@/lib/geofence";

type ResultKind = "inside" | "outside" | "error" | null;

type HttpLog = {
  request: string;
  response: string;
  durationMs: number;
};

type BoundsState = {
  minLng: string;
  minLat: string;
  maxLng: string;
  maxLat: string;
};

type PointState = {
  lat: string;
  lng: string;
};

const defaultBounds: BoundsState = {
  minLng: String(DEFAULT_POLYGON.minLng),
  minLat: String(DEFAULT_POLYGON.minLat),
  maxLng: String(DEFAULT_POLYGON.maxLng),
  maxLat: String(DEFAULT_POLYGON.maxLat),
};

function parseBounds(state: BoundsState): PolygonBounds | null {
  const minLng = Number(state.minLng);
  const minLat = Number(state.minLat);
  const maxLng = Number(state.maxLng);
  const maxLat = Number(state.maxLat);

  if (
    !Number.isFinite(minLng) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLng) ||
    !Number.isFinite(maxLat) ||
    minLng >= maxLng ||
    minLat >= maxLat
  ) {
    return null;
  }

  return { minLng, minLat, maxLng, maxLat };
}

export default function GeofencePage() {
  const [lat, setLat] = useState("37.779");
  const [lng, setLng] = useState("-122.414");
  const [bounds, setBounds] = useState<BoundsState>(defaultBounds);
  const [insideSample, setInsideSample] = useState<PointState>({
    lat: "37.779",
    lng: "-122.414",
  });
  const [outsideSample, setOutsideSample] = useState<PointState>({
    lat: "37.77",
    lng: "-122.5",
  });
  const [result, setResult] = useState<ResultKind>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [httpLog, setHttpLog] = useState<HttpLog | null>(null);
  const [loading, setLoading] = useState(false);

  const mapPolygon = useMemo(() => parseBounds(bounds), [bounds]);
  const mapLat = Number(lat);
  const mapLng = Number(lng);
  const mapPoint =
    Number.isFinite(mapLat) && Number.isFinite(mapLng)
      ? { lat: mapLat, lng: mapLng }
      : null;
  const mapInside =
    result === "inside" ? true : result === "outside" ? false : null;

  function applySample(sample: PointState) {
    setLat(sample.lat);
    setLng(sample.lng);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorMessage(null);
    setHttpLog(null);

    const polygon = parseBounds(bounds);
    if (!polygon) {
      setResult("error");
      setErrorMessage("Invalid polygon bounds (min must be less than max)");
      setLoading(false);
      return;
    }

    const payload = {
      lat: Number(lat),
      lng: Number(lng),
      polygon,
    };
    const requestBody = JSON.stringify(payload, null, 2);
    const requestLog = [
      "POST /api/geofence HTTP/1.1",
      "Host: " + (typeof window !== "undefined" ? window.location.host : "localhost"),
      "Content-Type: application/json",
      "",
      requestBody,
    ].join("\n");

    const started = performance.now();

    try {
      const response = await fetch("/api/geofence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const durationMs = Math.round(performance.now() - started);
      const responseText = await response.text();
      let responseBody = responseText;
      try {
        responseBody = JSON.stringify(JSON.parse(responseText), null, 2);
      } catch {
        /* keep raw text */
      }

      const responseLog = [
        `HTTP/1.1 ${response.status} ${response.statusText}`,
        "Content-Type: application/json",
        "",
        responseBody,
      ].join("\n");

      setHttpLog({ request: requestLog, response: responseLog, durationMs });

      let data: { inside?: boolean; error?: string } = {};
      try {
        data = JSON.parse(responseText) as { inside?: boolean; error?: string };
      } catch {
        data = {};
      }

      if (!response.ok) {
        setResult("error");
        setErrorMessage(data.error ?? "Request failed");
        return;
      }

      setResult(data.inside ? "inside" : "outside");
    } catch (error) {
      const durationMs = Math.round(performance.now() - started);
      const message =
        error instanceof Error ? error.message : "Request failed";
      setHttpLog({
        request: requestLog,
        response: `HTTP/1.1 — Network error\n\n${message}`,
        durationMs,
      });
      setResult("error");
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page geofence-page">
      <header className="page-header">
        <h1>PostGIS geofence</h1>
        <p>
          Edit the polygon bounding box and sample points, then check whether a
          coordinate falls inside via <code>ST_Contains</code>.
        </p>
      </header>

      <div className="geofence-layout">
        <div className="geofence-main">
      <section className="card">
        <h2>Polygon bounds</h2>
        <p className="hint" style={{ marginBottom: "1rem" }}>
          Defaults to the SF demo box. Adjust corners to change the geofence.
        </p>
        <div className="form-row form-row-4">
          <div className="field">
            <label htmlFor="minLng">Min longitude</label>
            <input
              id="minLng"
              value={bounds.minLng}
              onChange={(e) =>
                setBounds((b) => ({ ...b, minLng: e.target.value }))
              }
              type="number"
              step="any"
            />
          </div>
          <div className="field">
            <label htmlFor="minLat">Min latitude</label>
            <input
              id="minLat"
              value={bounds.minLat}
              onChange={(e) =>
                setBounds((b) => ({ ...b, minLat: e.target.value }))
              }
              type="number"
              step="any"
            />
          </div>
          <div className="field">
            <label htmlFor="maxLng">Max longitude</label>
            <input
              id="maxLng"
              value={bounds.maxLng}
              onChange={(e) =>
                setBounds((b) => ({ ...b, maxLng: e.target.value }))
              }
              type="number"
              step="any"
            />
          </div>
          <div className="field">
            <label htmlFor="maxLat">Max latitude</label>
            <input
              id="maxLat"
              value={bounds.maxLat}
              onChange={(e) =>
                setBounds((b) => ({ ...b, maxLat: e.target.value }))
              }
              type="number"
              step="any"
            />
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Sample points</h2>
        <div className="preset-grid">
          <div className="preset-block">
            <h3>Inside sample</h3>
            <div className="form-row form-row-preset">
              <div className="field">
                <label htmlFor="inside-lat">Lat</label>
                <input
                  id="inside-lat"
                  value={insideSample.lat}
                  onChange={(e) =>
                    setInsideSample((s) => ({ ...s, lat: e.target.value }))
                  }
                  type="number"
                  step="any"
                />
              </div>
              <div className="field">
                <label htmlFor="inside-lng">Lng</label>
                <input
                  id="inside-lng"
                  value={insideSample.lng}
                  onChange={(e) =>
                    setInsideSample((s) => ({ ...s, lng: e.target.value }))
                  }
                  type="number"
                  step="any"
                />
              </div>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => applySample(insideSample)}
              >
                Use for check
              </button>
            </div>
          </div>
          <div className="preset-block">
            <h3>Outside sample</h3>
            <div className="form-row form-row-preset">
              <div className="field">
                <label htmlFor="outside-lat">Lat</label>
                <input
                  id="outside-lat"
                  value={outsideSample.lat}
                  onChange={(e) =>
                    setOutsideSample((s) => ({ ...s, lat: e.target.value }))
                  }
                  type="number"
                  step="any"
                />
              </div>
              <div className="field">
                <label htmlFor="outside-lng">Lng</label>
                <input
                  id="outside-lng"
                  value={outsideSample.lng}
                  onChange={(e) =>
                    setOutsideSample((s) => ({ ...s, lng: e.target.value }))
                  }
                  type="number"
                  step="any"
                />
              </div>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => applySample(outsideSample)}
              >
                Use for check
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Check point</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="field">
              <label htmlFor="lat">Latitude</label>
              <input
                id="lat"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                type="number"
                step="any"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="lng">Longitude</label>
              <input
                id="lng"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                type="number"
                step="any"
                required
              />
            </div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Checking…" : "Check point"}
            </button>
          </div>
        </form>

        {result !== null && (
          <div className="result-panel">
            <span>Result</span>
            {result === "inside" && (
              <span className="badge badge-success">Inside polygon</span>
            )}
            {result === "outside" && (
              <span className="badge badge-danger">Outside polygon</span>
            )}
            {result === "error" && (
              <>
                <span className="badge badge-warning">Error</span>
                <span className="hint">{errorMessage}</span>
              </>
            )}
          </div>
        )}

        {httpLog !== null && (
          <div className="http-log-panel">
            <div className="http-log-header">
              <h3>HTTP log</h3>
              <span className="badge badge-muted">{httpLog.durationMs} ms</span>
            </div>
            <pre className="http-log" aria-label="HTTP request">
              {httpLog.request}
            </pre>
            <pre className="http-log http-log-response" aria-label="HTTP response">
              {httpLog.response}
            </pre>
          </div>
        )}
      </section>
        </div>

        <aside className="geofence-map-panel card">
          <h2>Map</h2>
          <p className="hint map-legend">
            Blue box = polygon bounds · Dot = check point (green inside, red
            outside)
          </p>
          <GeofenceMap
            polygon={mapPolygon}
            lat={mapPoint?.lat ?? null}
            lng={mapPoint?.lng ?? null}
            inside={mapInside}
          />
        </aside>
      </div>
    </div>
  );
}
