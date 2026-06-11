import { useEffect, useState } from "react";
import { EarthquakeMap } from "./features/earthquakes/map/EarthquakeMap";
import { Sidebar } from "./features/earthquakes/sidebar/Sidebar";
import { useEarthquakes } from "./features/earthquakes/hooks/useEarthquakes";
import type { EarthquakeFilters } from "./features/earthquakes/api/types";
import styles from "./App.module.css";

const SIDEBAR_WIDTH = 300;

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDefaultFilters(): EarthquakeFilters {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  return {
    starttime: localDateStr(thirtyDaysAgo),
    endtime: localDateStr(today),
    minmagnitude: 4.5,
  };
}

export default function App() {
  const [defaultFilters] = useState<EarthquakeFilters>(getDefaultFilters);
  const { status, query } = useEarthquakes();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);

  useEffect(() => {
    query(defaultFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(filters: EarthquakeFilters) {
    if (window.innerWidth <= 768) setSidebarOpen(false);
    query(filters).then((result) => {
      if (result && (result.kind === "error" || result.kind === "empty")) {
        setSidebarOpen(true);
      }
    });
  }

  const mapData = status.kind === "success" ? status.data : null;

  return (
    <div className={styles.layout}>
      <Sidebar
        status={status}
        defaultFilters={defaultFilters}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSubmit={handleSubmit}
      />

      <div className={styles.mapArea}>
        <header className={styles.topBar}>
          <button
            className={styles.menuBtn}
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={
              sidebarOpen ? "Close filter panel" : "Open filter panel"
            }
            aria-expanded={sidebarOpen}
          >
            <span aria-hidden="true">{"☰"}</span>
            Filters
          </button>

          {status.kind === "loading" && (
            <span className={styles.loadingBadge} aria-live="polite">
              <span className={styles.dot} aria-hidden="true" />
              Loading…
            </span>
          )}

          {status.kind === "success" && (
            <span className={styles.countBadge}>
              {status.data.features.length.toLocaleString()} earthquakes
            </span>
          )}

          {status.kind === "error" && (
            <span className={styles.errorBadge} role="alert">
              {status.overLimit ? "Too many results" : "Error loading data"}
            </span>
          )}
        </header>

        <EarthquakeMap
          data={mapData}
          sidebarWidth={sidebarOpen ? SIDEBAR_WIDTH : 0}
        />
      </div>
    </div>
  );
}
