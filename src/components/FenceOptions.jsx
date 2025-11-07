import React, { useCallback } from "react";

const FenceOptions = ({ options, selected, wind, requiredHeight, onToggle }) => {
  const optionDisabled = useCallback(
    (option) => {
      if (!wind) return true;
      const heightTooShort = requiredHeight > option.maxHeight_m;
      const overCapacity = wind.pressure_kpa > option.capacity_kpa;
      return heightTooShort || overCapacity;
    },
    [requiredHeight, wind]
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-medium">Fencing options</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const disabled = optionDisabled(option);
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id, disabled)}
              className={`group relative overflow-hidden rounded-2xl border p-3 text-left shadow-sm transition ${
                disabled
                  ? "cursor-not-allowed opacity-50 grayscale"
                  : isSelected
                  ? "ring-2 ring-[var(--mwp-navy)]"
                  : "hover:shadow"
              }`}
            >
              <img src={option.img} alt={option.name} className="mb-3 h-36 w-full rounded-xl object-cover" />
              <div className="text-sm font-medium">{option.name}</div>
              <div className="mt-1 text-xs text-gray-600">
                Capacity: {option.capacity_kpa.toFixed(3)} kPa · Max height: {option.maxHeight_m.toFixed(1)} m
              </div>
              {disabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-xs font-medium text-gray-700">
                  Not applicable
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex flex-col items-start gap-3">
        <div className="text-sm">
          Download {selected.length} selected Heras fence option{selected.length === 1 ? "" : "s"}
        </div>
        <button
          disabled={selected.length === 0}
          className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
            selected.length === 0 ? "cursor-not-allowed bg-gray-300 text-gray-600" : ""
          }`}
          style={selected.length === 0 ? {} : { background: "#003A5D", color: "#fff" }}
        >
          Download selected
        </button>
        <p className="text-xs text-gray-500">
          Mock only – would download drawings and calcs with title blocks populated.
        </p>
      </div>
    </div>
  );
};

export default FenceOptions;
