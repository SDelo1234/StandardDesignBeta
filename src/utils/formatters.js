export const formatWindSpeed = (value) => {
  if (!Number.isFinite(value)) return "–";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)} m/s` : `${rounded.toFixed(1)} m/s`;
};

export const formatPressure = (value) => {
  if (!Number.isFinite(value)) return "–";
  return `${value.toFixed(3)} kPa`;
};

export const formatFactor = (value) => {
  if (!Number.isFinite(value)) return "–";
  return value.toFixed(2);
};

export const formatAltitudeValue = (value) => {
  if (value === null || value === undefined) return null;
  const rounded = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(rounded)) return null;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)} m AOD` : `${rounded.toFixed(1)} m AOD`;
};
