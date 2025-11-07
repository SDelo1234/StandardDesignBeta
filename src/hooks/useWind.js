import { useEffect, useMemo, useState } from "react";

const computeWindInternal = (postcode) => {
  const cleaned = (postcode || "").toUpperCase().split(" ").join("");
  const base = 22;
  const codeSum = cleaned.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const speed = Math.round(base + (codeSum % 11));
  const pressureRaw = Number((0.0005 * speed * speed).toFixed(3));
  const pressure_kpa = Math.min(pressureRaw, 0.149);
  const speed_ms = Math.round(Math.sqrt(pressure_kpa / 0.0005));
  return { speed_ms, pressure_kpa };
};

const useWind = (postcode) => {
  const [wind, setWind] = useState(null);

  useEffect(() => {
    const trimmed = (postcode || "").trim();
    if (trimmed) {
      setWind(computeWindInternal(trimmed));
    } else {
      setWind(null);
    }
  }, [postcode]);

  const computeWind = useMemo(() => computeWindInternal, []);

  return { wind, computeWind };
};

export default useWind;
