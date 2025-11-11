import React, { useId, useMemo, useState } from "react";
import {
  DEFAULT_TERRAIN_CATEGORY,
  TERRAIN_CATEGORY_OPTIONS,
  Z0_BY_TERRAIN,
} from "../utils/terrain";

const formatRoughness = (value) => {
  if (!Number.isFinite(value)) return "–";
  return value < 0.01 ? value.toFixed(3) : value.toFixed(2);
};

const TerrainCategorySelector = ({ value, onChange, error }) => {
  const [failedImages, setFailedImages] = useState({});
  const labelId = useId();
  const helpId = useId();

  const currentValue = useMemo(
    () => value || DEFAULT_TERRAIN_CATEGORY,
    [value],
  );

  const handleSelect = (id) => {
    if (onChange) {
      onChange(id);
    }
  };

  const markImageFailed = (id) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={helpId}
      className="flex flex-col"
    >
      <label className="mb-2 block text-sm font-medium" id={labelId}>
        Terrain category (EN 1991-1-4)
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {TERRAIN_CATEGORY_OPTIONS.map((option) => {
          const selected = currentValue === option.id;
          const roughness = Z0_BY_TERRAIN[option.id];
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handleSelect(option.id)}
              className={`group flex h-full flex-col rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mwp-navy)] focus-visible:ring-offset-2 ${
                selected
                  ? "border-[var(--mwp-navy)] ring-2 ring-[var(--mwp-navy)]"
                  : "border-gray-300 hover:border-gray-400 hover:shadow"
              }`}
            >
              <div className="mb-2 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                {failedImages[option.id] ? (
                  <span className="px-3 text-center text-sm font-semibold text-gray-500">
                    {option.title}
                  </span>
                ) : (
                  <img
                    src={option.img}
                    alt={option.alt}
                    className="h-full w-full object-contain"
                    onError={() => markImageFailed(option.id)}
                  />
                )}
              </div>
              <div className="font-semibold text-sm sm:text-base">{option.title}</div>
              <div className="mt-1 text-xs text-gray-600 sm:text-sm">{option.desc}</div>
              <div className="mt-2 text-xs font-medium text-gray-500">
                z₀ = {formatRoughness(roughness)} m
              </div>
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-gray-500" id={helpId}>
        Select the terrain category around the site per EN 1991-1-4.
      </p>
    </div>
  );
};

export default TerrainCategorySelector;
