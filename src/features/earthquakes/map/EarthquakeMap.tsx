import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { EarthquakeCollection, EarthquakeFeature } from "../api/types";
import { EarthquakePopup } from "./EarthquakePopup";
import styles from "./EarthquakeMap.module.css";

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const SOURCE_ID = "earthquakes";
const LAYER_ID = "earthquake-circles";

const CIRCLE_RADIUS: maplibregl.ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["coalesce", ["get", "mag"], 0],
  1,
  4,
  3,
  7,
  5,
  14,
  7,
  26,
  9,
  40,
];

const CIRCLE_COLOR = "#fb923c";

function withDepth(data: EarthquakeCollection): EarthquakeCollection {
  return {
    ...data,
    features: data.features.map((f) => ({
      ...f,
      properties: { ...f.properties, depth: f.geometry.coordinates[2] },
    })),
  };
}

function getBounds(
  features: EarthquakeFeature[]
): [[number, number], [number, number]] {
  const lngs = features.map((f) => f.geometry.coordinates[0]);
  const lats = features.map((f) => f.geometry.coordinates[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

interface PopupState {
  feature: EarthquakeFeature;
  container: HTMLElement;
  popup: maplibregl.Popup;
}

interface Props {
  data: EarthquakeCollection | null;
  sidebarWidth: number;
}

export function EarthquakeMap({ data, sidebarWidth }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  const [popupState, setPopupState] = useState<PopupState | null>(null);
  const [isBasemapLoading, setIsBasemapLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [0, 20],
      zoom: 2,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      setIsBasemapLoading(false);

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": CIRCLE_RADIUS,
          "circle-color": CIRCLE_COLOR,
          "circle-opacity": 0.8,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(0,0,0,0.25)",
        },
      });

      map.on("click", LAYER_ID, (e) => {
        if (!e.features?.length) return;
        const feature = e.features[0] as unknown as EarthquakeFeature;
        const [lng, lat] = feature.geometry.coordinates;

        activePopupRef.current = null;

        const el = document.createElement("div");
        const popup = new maplibregl.Popup({
          closeButton: false,
          maxWidth: "280px",
          className: "eq-popup",
        })
          .setLngLat([lng, lat])
          .setDOMContent(el)
          .addTo(map);

        activePopupRef.current = popup;

        popup.on("close", () => {
          if (activePopupRef.current === popup) {
            activePopupRef.current = null;
            setPopupState(null);
          }
        });

        setPopupState({ feature, container: el, popup });
      });

      map.on("mouseenter", LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyData = () => {
      const source = map.getSource(SOURCE_ID) as
        | maplibregl.GeoJSONSource
        | undefined;
      if (!source) return;

      popupState?.popup.remove();

      if (!data || data.features.length === 0) {
        source.setData({ type: "FeatureCollection", features: [] });
        return;
      }

      source.setData(withDepth(data));

      if (data.features.length === 1) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        map.flyTo({
          center: [lng, lat],
          zoom: 8,
          padding: { left: sidebarWidth },
        });
        return;
      }

      map.fitBounds(getBounds(data.features), {
        padding: { top: 60, bottom: 60, left: sidebarWidth + 60, right: 60 },
        duration: 800,
        maxZoom: 12,
      });
    };

    if (map.isStyleLoaded()) {
      applyData();
    } else {
      map.once("load", applyData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sidebarWidth]);

  function closePopup() {
    popupState?.popup.remove();
    setPopupState(null);
  }

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.map} />
      {isBasemapLoading && (
        <div className={styles.basemapOverlay} aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <p>Loading map…</p>
        </div>
      )}
      {popupState && (
        <EarthquakePopup
          feature={popupState.feature}
          container={popupState.container}
          onClose={closePopup}
        />
      )}
    </div>
  );
}
