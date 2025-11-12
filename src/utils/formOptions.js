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

export const DURATION_OPTIONS = [
  { value: "UNDER_3_DAYS", label: "Under 3 days" },
  { value: "UNDER_1_MONTH", label: "Under 1 month" },
  { value: "UNDER_2_MONTHS", label: "Under 2 months" },
  { value: "UNDER_4_MONTHS", label: "Under 4 months" },
  { value: "UNDER_A_YEAR", label: "Under a year" },
  { value: "OVER_A_YEAR", label: "Over a year" },
];

export const getDurationLabel = (value) => {
  if (!value) return null;
  const option = DURATION_OPTIONS.find((item) => item.value === value);
  return option ? option.label : null;
};
