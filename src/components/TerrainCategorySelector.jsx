import React, { useId } from "react";
import { TERRAIN_OPTIONS } from "../utils/terrain";

const TerrainIcon = ({ id }) =>
  id === "town" ? (
    <svg viewBox="0 0 64 32" className="h-10 w-20" aria-hidden="true">
      <path d="M0 30h64" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="12" width="10" height="18" fill="currentColor" opacity="0.5" />
      <rect x="17" y="4" width="10" height="26" fill="currentColor" opacity="0.7" />
      <rect x="30" y="14" width="8" height="16" fill="currentColor" opacity="0.5" />
      <rect x="41" y="8" width="10" height="22" fill="currentColor" opacity="0.7" />
      <rect x="54" y="16" width="7" height="14" fill="currentColor" opacity="0.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 64 32" className="h-10 w-20" aria-hidden="true">
      <path d="M0 30h64" stroke="currentColor" strokeWidth="1.5" />
      <path d="M0 30 Q16 22 32 27 T64 25 V30Z" fill="currentColor" opacity="0.25" />
      <circle cx="14" cy="20" r="4" fill="currentColor" opacity="0.6" />
      <rect x="13.3" y="23" width="1.4" height="7" fill="currentColor" opacity="0.6" />
      <rect x="40" y="22" width="8" height="8" fill="currentColor" opacity="0.6" />
      <path d="M39 22 L44 18 L49 22Z" fill="currentColor" opacity="0.6" />
    </svg>
  );

const TerrainCategorySelector = ({ value, onChange }) => {
  const labelId = useId();
  return (
    <div role="radiogroup" aria-labelledby={labelId}>
      <div id={labelId} className="mb-2 text-sm font-medium">
        Terrain (UK NA)
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TERRAIN_OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mwp-navy)] ${
                selected
                  ? "border-[var(--mwp-navy)] ring-2 ring-[var(--mwp-navy)]"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <span className="text-[var(--mwp-navy)]">
                <TerrainIcon id={option.id} />
              </span>
              <span>
                <span className="block text-sm font-semibold">{option.title}</span>
                <span className="block text-xs text-gray-600">{option.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TerrainCategorySelector;
