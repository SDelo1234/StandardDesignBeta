import React from "react";
import { formatPressure } from "../utils/formatters";

const W = 380;
const DIM_X = 330;
const H = 220;
const GROUND = 180;
const FENCE_X = 200;
const PX_PER_M = 50;

/** Indicative section through the fence: height, wind pressure and support type. */
const FenceElevation = ({ height, qp, option }) => {
  const h = height * PX_PER_M;
  const top = GROUND - h;
  const sketch = option?.sketch || "panel";
  const arrows = [0.2, 0.45, 0.7, 0.92].map((f) => top + h * f);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium">Section through fence</h3>
      <p className="mb-2 text-xs text-gray-500">{option ? option.name : "Indicative; select a system to show its support"}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Fence ${height} m high under ${formatPressure(qp)}`}>
        <defs>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="#2563eb" />
          </marker>
          <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#9ca3af" strokeWidth="1" />
          </pattern>
        </defs>

        {/* ground */}
        <rect x="10" y={GROUND} width={W - 20} height="14" fill="url(#hatch)" />
        <line x1="10" x2={W - 10} y1={GROUND} y2={GROUND} stroke="#374151" strokeWidth="1.5" />

        {/* wind */}
        {arrows.map((ay) => (
          <line key={ay} x1="40" x2={FENCE_X - 8} y1={ay} y2={ay} stroke="#2563eb" strokeWidth="2" markerEnd="url(#arrowhead)" />
        ))}
        <text x="40" y={top - 8} fontSize="11" fill="#1e40af" fontWeight="600">
          qp = {formatPressure(qp)}
        </text>

        {/* fence */}
        <rect x={FENCE_X - 3} y={top} width="6" height={h} fill="#003A5D" />
        {sketch === "panel" && <rect x={FENCE_X - 22} y={GROUND - 10} width="44" height="10" rx="2" fill="#6b7280" />}
        {sketch === "brace" && (
          <>
            <rect x={FENCE_X - 22} y={GROUND - 10} width="44" height="10" rx="2" fill="#6b7280" />
            <line x1={FENCE_X} y1={top + h * 0.35} x2={FENCE_X + h * 0.6} y2={GROUND - 4} stroke="#003A5D" strokeWidth="3" />
            <rect x={FENCE_X + h * 0.6 - 14} y={GROUND - 12} width="28" height="12" rx="2" fill="#6b7280" />
          </>
        )}
        {sketch === "buttress" && (
          <path
            d={`M${FENCE_X + 3},${top + h * 0.15} L${FENCE_X + 3 + h * 0.5},${GROUND} L${FENCE_X + 3},${GROUND} Z`}
            fill="none"
            stroke="#003A5D"
            strokeWidth="3"
          />
        )}
        {sketch === "ballast" && (
          <>
            <line x1={FENCE_X} y1={top + h * 0.3} x2={FENCE_X + h * 0.55} y2={GROUND - 6} stroke="#003A5D" strokeWidth="3" />
            <rect x={FENCE_X - 26} y={GROUND - 16} width="52" height="16" rx="2" fill="#6b7280" />
            <rect x={FENCE_X + h * 0.55 - 20} y={GROUND - 18} width="40" height="18" rx="2" fill="#6b7280" />
          </>
        )}

        {/* height dimension */}
        <line x1={DIM_X} x2={DIM_X} y1={top} y2={GROUND} stroke="#374151" strokeWidth="1" />
        <line x1={DIM_X - 6} x2={DIM_X + 6} y1={top} y2={top} stroke="#374151" strokeWidth="1" />
        <line x1={DIM_X - 6} x2={DIM_X + 6} y1={GROUND} y2={GROUND} stroke="#374151" strokeWidth="1" />
        <text x={DIM_X + 8} y={(top + GROUND) / 2 + 4} fontSize="11" fill="#111827">
          {height.toFixed(1)} m
        </text>
      </svg>
    </div>
  );
};

export default FenceElevation;
