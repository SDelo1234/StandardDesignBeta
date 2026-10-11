import React, { useId } from "react";

export const inputClass = (hasError) =>
  `w-full rounded-xl border p-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)] sm:text-sm ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;

export const Section = ({ step, title, children, aside }) => (
  <section className="rounded-2xl bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-3 text-lg font-medium">
        {step && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--mwp-navy)] text-sm text-white">
            {step}
          </span>
        )}
        {title}
      </h2>
      {aside}
    </div>
    {children}
  </section>
);

/** Label + control + help/error, with the label and messages linked to the control. */
export const Field = ({ label, error, help, badge, children, className = "" }) => {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, help ? helpId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        {badge}
      </div>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
      {help && (
        <p id={helpId} className="mt-1 text-xs text-gray-500">
          {help}
        </p>
      )}
    </div>
  );
};

const BADGE_STYLES = {
  dataset: "bg-blue-50 text-blue-700 ring-blue-200",
  auto: "bg-blue-50 text-blue-700 ring-blue-200",
  approx: "bg-amber-50 text-amber-800 ring-amber-200",
  manual: "bg-violet-50 text-violet-700 ring-violet-200",
  missing: "bg-red-50 text-red-700 ring-red-200",
  loading: "bg-gray-50 text-gray-600 ring-gray-200",
};

/** Shows where a value came from: dataset, auto, approximate, manual or missing. */
export const SourceBadge = ({ kind, children }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
      BADGE_STYLES[kind] || BADGE_STYLES.loading
    }`}
  >
    {children}
  </span>
);
