import { DURATIONS } from "./fenceDesign.js";

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DURATION_OPTIONS = Object.entries(DURATIONS).map(([value, { label }]) => ({
  value,
  label,
}));

export const getDurationLabel = (value) => DURATIONS[value]?.label ?? null;

export const GROUND_OPTIONS = [
  "Hardstanding (concrete/asphalt)",
  "Firm granular (Type 1/compacted)",
  "Soft/grass/soil",
  "Unknown – assume worst case",
];

export const HEIGHT_OPTIONS = [2.0, 2.4, 3.0];
