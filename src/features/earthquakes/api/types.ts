export interface EarthquakeProperties {
  place: string | null;
  mag: number | null;
  time: number;
  title: string;
  depth?: number;
}

export interface EarthquakeFeature {
  type: "Feature";
  id: string;
  geometry: {
    type: "Point";
    coordinates: [number, number, number];
  };
  properties: EarthquakeProperties;
}

export interface EarthquakeCollection {
  type: "FeatureCollection";
  features: EarthquakeFeature[];
  metadata: {
    count: number;
    title: string;
  };
}

export interface EarthquakeFilters {
  starttime: string;
  endtime: string;
  minmagnitude: number;
}

export type FetchStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: EarthquakeCollection }
  | { kind: "empty" }
  | { kind: "error"; message: string; overLimit?: boolean };
