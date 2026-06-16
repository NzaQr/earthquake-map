import { useCallback, useRef, useState } from "react";
import { fetchEarthquakes } from "../api/usgs";
import type { EarthquakeFilters, FetchStatus } from "../api/types";

export function useEarthquakes() {
  const [status, setStatus] = useState<FetchStatus>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const query = useCallback(
    async (filters: EarthquakeFilters): Promise<FetchStatus | null> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const data = await fetchEarthquakes(filters, controller.signal, () =>
          setStatus({ kind: "loading" }),
        );

        const result: FetchStatus =
          data.features.length === 0
            ? { kind: "empty" }
            : { kind: "success", data };
        setStatus(result);
        return result;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }

        const result: FetchStatus =
          err instanceof Error && err.name === "OverLimitError"
            ? {
                kind: "error",
                message:
                  "Too many results (over 20,000). Try a shorter date range or a higher minimum magnitude.",
                overLimit: true,
              }
            : {
                kind: "error",
                message:
                  err instanceof Error
                    ? err.message
                    : "Unexpected error. Please try again.",
              };
        setStatus(result);
        return result;
      }
    },
    [],
  );

  return { status, query };
}
