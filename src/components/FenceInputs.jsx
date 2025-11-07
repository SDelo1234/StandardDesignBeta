import React from "react";

const FenceInputs = ({ form, errors, onChange }) => (
  <form className="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <section className="lg:col-span-3 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-medium">Project details</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Project name</label>
          <input
            className={`w-full rounded-xl border p-2.5 focus:outline-none focus:ring ${
              errors.projectName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Longreach STW – Perimeter"
            value={form.projectName}
            onChange={(e) => onChange("projectName", e.target.value)}
          />
          {errors.projectName && <p className="mt-1 text-xs text-red-600">{errors.projectName}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Project postcode</label>
          <input
            className={`w-full rounded-xl border p-2.5 uppercase focus:outline-none focus:ring ${
              errors.postcode ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="SW4 6QD"
            value={form.postcode}
            onChange={(e) => onChange("postcode", e.target.value.toUpperCase())}
          />
          {errors.postcode && <p className="mt-1 text-xs text-red-600">{errors.postcode}</p>}
          <p className="mt-1 text-xs text-gray-500">Used to derive site wind data.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Expected duration on site</label>
          <select
            className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring"
            value={form.duration}
            onChange={(e) => onChange("duration", e.target.value)}
          >
            <option>&lt; 28 days</option>
            <option>1–3 months</option>
            <option>3–6 months</option>
            <option>&gt; 6 months</option>
          </select>
        </div>
      </div>
    </section>

    <section className="lg:col-span-3 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-medium">Site conditions</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Ground conditions</label>
          <select
            className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring"
            value={form.ground}
            onChange={(e) => onChange("ground", e.target.value)}
          >
            <option>Hardstanding (concrete/asphalt)</option>
            <option>Firm granular (Type 1/compacted)</option>
            <option>Soft/grass/soil</option>
            <option>Unknown – assume worst case</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Distance to sea</label>
          <input
            className="w-full rounded-xl border p-2.5 focus:outline-none focus:ring"
            placeholder="km"
            value={form.distanceToSea}
            onChange={(e) => onChange("distanceToSea", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Altitude</label>
          <input
            className="w-full rounded-xl border p-2.5 focus:outline-none focus:ring"
            placeholder="m AOD"
            value={form.altitude}
            onChange={(e) => onChange("altitude", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Fence height</label>
          <select
            className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring"
            value={form.height}
            onChange={(e) => onChange("height", e.target.value)}
          >
            <option>2.0 m</option>
            <option>2.4 m</option>
            <option>3.0 m</option>
          </select>
        </div>
      </div>
    </section>
  </form>
);

export default FenceInputs;
