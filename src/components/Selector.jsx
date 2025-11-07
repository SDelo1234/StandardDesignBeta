import React from "react";

const Selector = ({ onSelectFences, onSelectShafts }) => {
  const IMG3 = "https://i.ibb.co/VYkkBwWW/IMG3-fence-3.jpg";

  return (
    <section className="mb-6">
      <h2 className="mb-4 text-lg font-medium">Choose a tool</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSelectFences}
          className="group relative overflow-hidden rounded-2xl border p-3 text-left shadow-sm hover:shadow"
          aria-label="Open Fences tool"
        >
          <img src={IMG3} alt="Fences" className="mb-3 h-36 w-full rounded-xl object-cover" />
          <div className="text-sm font-medium">Fences</div>
          <div className="mt-1 text-xs text-gray-600">Site-specific Heras fencing</div>
        </button>
        <button
          type="button"
          onClick={onSelectShafts}
          className="group relative overflow-hidden rounded-2xl border p-3 text-left shadow-sm opacity-60"
          aria-label="Shafts (coming soon)"
        >
          <div className="mb-3 flex h-36 w-full items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-500">
            No image
          </div>
          <div className="text-sm font-medium">Shafts</div>
          <div className="mt-1 text-xs text-gray-600">Coming soon</div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-xs font-medium text-gray-700">
            Coming soon
          </div>
        </button>
      </div>
    </section>
  );
};

export default Selector;
