"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

type CounterPayload = {
  value: number;
  sentAt: number;
};

type LatencyInfo = {
  ms: number;
  mode: "round-trip" | "broadcast";
};

function parseCounterPayload(data: CounterPayload | number): CounterPayload {
  if (typeof data === "number") {
    return { value: data, sentAt: Date.now() };
  }
  return data;
}

/** Sub-ms precision for local round-trip; avoids misleading "0 ms" from Math.round(). */
function formatLatency(ms: number): string {
  if (ms < 0.1) {
    return "< 0.1 ms";
  }
  if (ms < 10) {
    return `${ms.toFixed(1)} ms`;
  }
  return `${Math.round(ms)} ms`;
}

export default function RealtimePage() {
  const [counter, setCounter] = useState(0);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latency, setLatency] = useState<LatencyInfo | null>(null);
  const incrementStartedAt = useRef<number | null>(null);
  const isInitialCounter = useRef(true);

  useEffect(() => {
    let activeSocket: Socket | null = null;

    function onCounter(data: CounterPayload | number) {
      const { value, sentAt } = parseCounterPayload(data);
      setCounter(value);

      if (isInitialCounter.current) {
        isInitialCounter.current = false;
        return;
      }

      if (incrementStartedAt.current !== null) {
        const ms = performance.now() - incrementStartedAt.current;
        setLatency({ ms, mode: "round-trip" });
        incrementStartedAt.current = null;
      } else {
        // Server Date.now() → client Date.now(); 1 ms ticks, not full click→event path
        setLatency({
          ms: Math.max(0, Date.now() - sentAt),
          mode: "broadcast",
        });
      }
    }

    async function connect() {
      const { io } = await import("socket.io-client");
      activeSocket = io(window.location.origin, { path: "/socket.io" });
      setSocket(activeSocket);

      activeSocket.on("connect", () => setConnected(true));
      activeSocket.on("disconnect", () => setConnected(false));
      activeSocket.on("counter", onCounter);
    }

    connect();

    return () => {
      activeSocket?.disconnect();
    };
  }, []);

  function handleIncrement() {
    if (!socket) {
      return;
    }
    incrementStartedAt.current = performance.now();
    setLatency(null);
    socket.emit("increment");
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Socket.io counter</h1>
        <p>
          Open this page in two browser tabs. Click increment in one; the other
          updates in under 500ms via broadcast.
        </p>
      </header>

      <section className="card">
        <span
          className={`badge ${connected ? "badge-success" : "badge-muted"}`}
        >
          {connected ? "Connected" : "Connecting…"}
        </span>

        <p className="counter-display" aria-live="polite">
          {counter}
        </p>

        {latency !== null && (
          <p className="latency-display">
            {latency.mode === "round-trip" ? (
              <>
                Round-trip (click → event):{" "}
                <strong>{formatLatency(latency.ms)}</strong>
              </>
            ) : (
              <>
                Broadcast (server sent → this tab):{" "}
                <strong>{formatLatency(latency.ms)}</strong>
              </>
            )}
            <span className="hint">
              {latency.mode === "round-trip"
                ? " Measured with high-resolution timer on this tab only."
                : " Uses 1 ms wall-clock ticks; on localhost often shows 0–1 ms."}
            </span>
          </p>
        )}

        <div className="realtime-actions">
          <button
            className="btn btn-lg"
            type="button"
            disabled={!socket || !connected}
            onClick={handleIncrement}
          >
            Increment
          </button>
          <p className="hint">
            Shared in-memory counter on <code>server.js</code>
          </p>
        </div>
      </section>
    </div>
  );
}
