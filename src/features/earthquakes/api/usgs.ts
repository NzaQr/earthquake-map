import { readEntry, ttlFor, writeEntry } from "./cache";
import type { EarthquakeCollection, EarthquakeFilters } from "./types";

const BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";

function localDayStart(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

function localDayEnd(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

function normalize(filters: EarthquakeFilters) {
  return {
    starttime: localDayStart(filters.starttime),
    endtime: localDayEnd(filters.endtime),
    minmagnitude: String(filters.minmagnitude),
  };
}

function cacheKey(n: ReturnType<typeof normalize>): string {
  return `${n.starttime}|${n.endtime}|${n.minmagnitude}`;
}

export async function fetchEarthquakes(
  filters: EarthquakeFilters,
  signal?: AbortSignal,
  onNetwork?: () => void,
): Promise<EarthquakeCollection> {
  const normalized = normalize(filters);

  const cached = await readEntry(cacheKey(normalized), ttlFor(filters.endtime));
  if (cached) return cached.data;

  onNetwork?.();
  const data = await fetchFromNetwork(normalized, signal);
  writeEntry(cacheKey(normalized), { data, fetchedAt: Date.now() });
  return data;
}

async function fetchFromNetwork(
  normalized: ReturnType<typeof normalize>,
  signal?: AbortSignal,
): Promise<EarthquakeCollection> {
  const params = new URLSearchParams({
    format: "geojson",
    ...normalized,
    orderby: "time",
  });
  const response = await fetch(`${BASE_URL}?${params}`, { signal });

  if (!response.ok) {
    if (response.status === 400) {
      const text = await response.text();
      if (
        text.includes("limit") ||
        text.includes("20000") ||
        text.includes("exceed")
      ) {
        const err = new Error("over_limit");
        err.name = "OverLimitError";
        throw err;
      }
      throw new Error(`Bad request: ${text}`);
    }
    throw new Error(
      `USGS API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: EarthquakeCollection = await response.json();
  return data;
}
