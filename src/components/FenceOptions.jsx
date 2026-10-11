import React from "react";
import { formatPressure } from "../utils/formatters";

const UtilisationBar = ({ utilisation, passes }) => {
  const pct = Number.isFinite(utilisation) ? utilisation * 100 : 0;
  const width = Math.min(pct, 100);
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">Utilisation</span>
        <span className="font-semibold tabular-nums text-gray-900">
          {passes ? "✓" : "✗"} {Math.round(pct)}%
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
        <div
          className={`h-full rounded-full ${passes ? (pct > 90 ? "bg-amber-500" : "bg-emerald-600") : "bg-red-600"}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

const FenceOptions = ({ result, selected, onToggle, onExportBrief, exporting, exportError }) => {
  const options = result?.ok ? result.options : [];
  const passing = options.filter((option) => option.passes).length;

  const briefButtonClasses = `inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--mwp-navy)] ${
    selected.length === 0
      ? "cursor-not-allowed bg-gray-200 text-gray-500"
      : "bg-[var(--mwp-navy)] text-white hover:bg-[#0f4b72]"
  }`;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-medium">Fencing options</h2>
        <span className="text-sm text-gray-600">
          {passing} of {options.length} suitable at qp = {formatPressure(result?.qp)}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const disabled = !option.passes;
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`relative rounded-2xl border p-3 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mwp-navy)] ${
                disabled
                  ? "cursor-not-allowed border-gray-200 bg-gray-50"
                  : isSelected
                  ? "border-[var(--mwp-navy)] ring-2 ring-[var(--mwp-navy)]"
                  : "border-gray-200 hover:shadow"
              }`}
            >
              <img
                src={option.img}
                alt=""
                className={`mb-3 h-32 w-full rounded-xl object-cover ${disabled ? "opacity-40 grayscale" : ""}`}
              />
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium">
                  {option.id}. {option.name}
                </div>
                {isSelected && <span className="rounded-full bg-[var(--mwp-navy)] px-2 text-xs text-white">Selected</span>}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Capacity qp {formatPressure(option.capacity_kpa)} · max height {option.maxHeight_m.toFixed(1)} m
              </div>
              {option.heightOk ? (
                <UtilisationBar utilisation={option.utilisation} passes={option.passes} />
              ) : (
                <div className="mt-2 text-xs font-medium text-red-700">✗ Too short for the fence height</div>
              )}
              {option.reason && option.heightOk && (
                <div className="mt-1 text-xs text-red-700">{option.reason}</div>
              )}
            </button>
          );
        })}
      </div>
      {passing === 0 && options.length > 0 && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          No standard system is suitable. Send the design brief for a custom design.
        </p>
      )}
      <div className="mt-5 flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={onExportBrief}
          disabled={(selected.length === 0 && passing > 0) || exporting}
          className={`${briefButtonClasses} ${exporting ? "cursor-wait" : ""} ${
            passing === 0 ? "!bg-[var(--mwp-navy)] !text-white" : ""
          }`}
          aria-busy={exporting ? "true" : "false"}
        >
          {exporting ? (
            <>
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"
                aria-hidden="true"
              />
              <span>Preparing design brief…</span>
            </>
          ) : passing === 0 ? (
            "Download design brief for custom design"
          ) : (
            `Download design brief (${selected.length} selected)`
          )}
        </button>
        {exportError && (
          <p role="alert" className="text-sm text-red-700">
            {exportError}
          </p>
        )}
        <p className="text-xs text-gray-500">The PDF includes the inputs, calculation, selected systems and a sign-off block.</p>
      </div>
    </div>
  );
};

export default FenceOptions;
