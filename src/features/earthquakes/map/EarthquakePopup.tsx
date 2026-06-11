import { createPortal } from "react-dom";
import type { EarthquakeFeature } from "../api/types";
import { formatTime } from "../utils/earthquake";
import styles from "./EarthquakePopup.module.css";

interface Props {
  feature: EarthquakeFeature;
  container: HTMLElement;
  onClose: () => void;
}

export function EarthquakePopup({ feature, container, onClose }: Props) {
  const { place, mag, time, depth } = feature.properties;
  const { absolute, relative } = formatTime(time);

  return createPortal(
    <div className={styles.popup}>
      <button className={styles.close} onClick={onClose} aria-label="Close popup">
        ×
      </button>
      <p className={styles.place}>{place ?? "Unknown location"}</p>
      <div className={styles.grid}>
        <span className={styles.label}>Magnitude</span>
        <span className={styles.value}>
          <strong>{mag?.toFixed(1) ?? "—"}</strong>
        </span>
        <span className={styles.label}>Depth</span>
        <span className={styles.value}>{depth?.toFixed(1) ?? "—"} km</span>
        <span className={styles.label}>Time</span>
        <span className={styles.value}>
          {absolute}
          <br />
          <em className={styles.relative}>{relative}</em>
        </span>
      </div>
    </div>,
    container
  );
}
