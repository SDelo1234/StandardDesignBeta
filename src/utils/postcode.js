export const normalisePostcode = (value) =>
  (value || "")
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export const extractPostcodeOutward = (value) => {
  const normalised = normalisePostcode(value);
  if (!normalised) return "";

  const match = normalised.match(/^(.*?)(\d[A-Z]{2})$/u);
  if (match && match[1]) {
    return match[1];
  }

  if (normalised.length > 3) {
    return normalised.slice(0, -3);
  }

  return normalised;
};

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
