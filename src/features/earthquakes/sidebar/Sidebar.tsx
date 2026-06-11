import type { EarthquakeFilters, FetchStatus } from "../api/types";
import { FilterForm } from "./FilterForm";
import { ResultsSummary } from "./ResultsSummary";
import styles from "./Sidebar.module.css";

interface Props {
  status: FetchStatus;
  defaultFilters: EarthquakeFilters;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (filters: EarthquakeFilters) => void;
}

export function Sidebar({ status, defaultFilters, isOpen, onClose, onSubmit }: Props) {
  const isLoading = status.kind === "loading";

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
        aria-label="Filter panel"
      >
        <div className={styles.header}>
          <span className={styles.logo}>🌍</span>
          <h1 className={styles.title}>Earthquake Map</h1>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close filter panel"
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <FilterForm
            onSubmit={onSubmit}
            isLoading={isLoading}
            defaultFilters={defaultFilters}
          />

          <div className={styles.divider} />

          <ResultsSummary status={status} />
        </div>
      </aside>
    </>
  );
}
