import type { FetchStatus } from "../api/types";
import styles from "./ResultsSummary.module.css";

interface Props {
  status: FetchStatus;
}

export function ResultsSummary({ status }: Props) {
  if (status.kind === "idle") {
    return (
      <div className={styles.idle}>
        <span className={styles.icon}>🔍</span>
        <p>Set your filters and press <strong>Search</strong> to load earthquake data.</p>
      </div>
    );
  }

  if (status.kind === "loading") {
    return (
      <div className={styles.loading} aria-live="polite" aria-busy="true">
        <span className={styles.spinner} />
        <p>Fetching earthquakes…</p>
      </div>
    );
  }

  if (status.kind === "empty") {
    return (
      <div className={styles.empty} aria-live="polite">
        <span className={styles.icon}>🌐</span>
        <p>No earthquakes found for these filters. Try a wider date range or lower minimum magnitude.</p>
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div className={styles.error} role="alert">
        <span className={styles.icon}>{status.overLimit ? "⚠️" : "❌"}</span>
        <p>
          {status.overLimit
            ? <>
                <strong>Too many results.</strong> The USGS API limit is 20,000 events.
                Try a shorter date range or a higher minimum magnitude.
              </>
            : <>
                <strong>Something went wrong.</strong> {status.message}
              </>
          }
        </p>
      </div>
    );
  }

  if (status.kind === "success") {
    const count = status.data.features.length;
    return (
      <div className={styles.success} aria-live="polite">
        <p className={styles.count}>
          <strong>{count.toLocaleString()}</strong>{" "}
          {count === 1 ? "earthquake" : "earthquakes"} found
        </p>
        <p className={styles.subtitle}>{status.data.metadata.title}</p>
      </div>
    );
  }

  return null;
}
