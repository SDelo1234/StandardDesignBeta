export const normalisePostcode = (value) =>
  (value || "")
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export const formatPostcode = (value) => {
  const normalised = normalisePostcode(value);
  if (!normalised) return "";
  if (normalised.length <= 3) {
    return normalised;
  }
  const inward = normalised.slice(-3);
  const outward = normalised.slice(0, normalised.length - 3);
  return `${outward} ${inward}`;
};
