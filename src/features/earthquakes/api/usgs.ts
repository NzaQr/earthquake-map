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

export async function fetchEarthquakes(
  filters: EarthquakeFilters,
  signal?: AbortSignal
): Promise<EarthquakeCollection> {
  const params = new URLSearchParams({
    format: "geojson",
    starttime: localDayStart(filters.starttime),
    endtime: localDayEnd(filters.endtime),
    minmagnitude: String(filters.minmagnitude),
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
    throw new Error(`USGS API error: ${response.status} ${response.statusText}`);
  }

  const data: EarthquakeCollection = await response.json();
  return data;
}
