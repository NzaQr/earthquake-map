import { useState } from "react";
import type { EarthquakeFilters } from "../api/types";
import styles from "./FilterForm.module.css";

interface Props {
  onSubmit: (filters: EarthquakeFilters) => void;
  isLoading: boolean;
  defaultFilters: EarthquakeFilters;
}

interface FormErrors {
  starttime?: string;
  endtime?: string;
  minmagnitude?: string;
  dateRange?: string;
}

function validate(
  starttime: string,
  endtime: string,
  minmagnitude: string
): FormErrors {
  const errors: FormErrors = {};
  const today = new Date().toISOString().slice(0, 10);

  if (!starttime) {
    errors.starttime = "Start date is required.";
  } else if (starttime > today) {
    errors.starttime = "Start date cannot be in the future.";
  }

  if (!endtime) {
    errors.endtime = "End date is required.";
  } else if (endtime > today) {
    errors.endtime = "End date cannot be in the future.";
  }

  if (starttime && endtime && !errors.starttime && !errors.endtime) {
    if (starttime > endtime) {
      errors.dateRange = "Start date must be before end date.";
    }
  }

  const mag = Number(minmagnitude);
  if (minmagnitude === "" || isNaN(mag)) {
    errors.minmagnitude = "Magnitude is required.";
  } else if (mag < 0 || mag > 10) {
    errors.minmagnitude = "Magnitude must be between 0 and 10.";
  }

  return errors;
}

export function FilterForm({ onSubmit, isLoading, defaultFilters }: Props) {
  const [starttime, setStarttime] = useState(defaultFilters.starttime);
  const [endtime, setEndtime] = useState(defaultFilters.endtime);
  const [minmagnitude, setMinmagnitude] = useState(
    String(defaultFilters.minmagnitude)
  );
  const [touched, setTouched] = useState({
    starttime: false,
    endtime: false,
    minmagnitude: false,
  });

  const errors = validate(starttime, endtime, minmagnitude);
  const hasErrors = Object.keys(errors).length > 0;

  const [submitted, setSubmitted] = useState(false);

  const showError = (field: keyof typeof touched) =>
    (touched[field] || submitted) && errors[field as keyof FormErrors];

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors) return;
    onSubmit({
      starttime,
      endtime,
      minmagnitude: Number(minmagnitude),
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Filter Earthquakes</h2>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Date range</legend>

        <div className={styles.field}>
          <label htmlFor="starttime" className={styles.label}>
            Start date
          </label>
          <input
            id="starttime"
            type="date"
            className={`${styles.input} ${showError("starttime") ? styles.inputError : ""}`}
            value={starttime}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setStarttime(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, starttime: true }))}
          />
          {showError("starttime") && (
            <p className={styles.error} role="alert">
              {errors.starttime}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="endtime" className={styles.label}>
            End date
          </label>
          <input
            id="endtime"
            type="date"
            className={`${styles.input} ${showError("endtime") ? styles.inputError : ""}`}
            value={endtime}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setEndtime(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, endtime: true }))}
          />
          {showError("endtime") && (
            <p className={styles.error} role="alert">
              {errors.endtime}
            </p>
          )}
        </div>

        {(touched.starttime || touched.endtime || submitted) &&
          errors.dateRange && (
            <p className={styles.error} role="alert">
              {errors.dateRange}
            </p>
          )}
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="minmagnitude" className={styles.label}>
          Minimum magnitude
        </label>
        <div className={styles.sliderRow}>
          <input
            id="minmagnitude-range"
            type="range"
            min={0}
            max={10}
            step={0.1}
            className={styles.slider}
            value={minmagnitude}
            onChange={(e) => {
              setMinmagnitude(e.target.value);
              setTouched((t) => ({ ...t, minmagnitude: true }));
            }}
          />
          <input
            id="minmagnitude"
            type="number"
            min={0}
            max={10}
            step={0.1}
            className={`${styles.inputNumber} ${showError("minmagnitude") ? styles.inputError : ""}`}
            value={minmagnitude}
            onChange={(e) => setMinmagnitude(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, minmagnitude: true }))}
          />
        </div>
        {showError("minmagnitude") && (
          <p className={styles.error} role="alert">
            {errors.minmagnitude}
          </p>
        )}
      </div>

      <button
        type="submit"
        className={styles.submit}
        disabled={isLoading || (submitted && hasErrors)}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Searching…
          </>
        ) : (
          "Search"
        )}
      </button>

      {submitted && hasErrors && !isLoading && (
        <p className={styles.formError} role="alert">
          Please fix the errors above before searching.
        </p>
      )}
    </form>
  );
}
