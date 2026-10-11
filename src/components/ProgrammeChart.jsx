import React, { useMemo, useState } from "react";
import { qpByStartMonth } from "../utils/fenceDesign";
import { MONTH_LABELS } from "../utils/formOptions";

const W = 360;
const H = 170;
const PAD = { top: 22, right: 8, bottom: 22, left: 36 };

/** Bar with a 4 px rounded top, anchored to the baseline. */
const barPath = (x, y, w, h, r = 4) => {
  const radius = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + w - radius}Q${x + w},${y} ${x + w},${y + radius}V${y + h}Z`;
};

/** Design pressure qp for each start month at the chosen duration. */
const ProgrammeChart = ({ inputs, selectedMonth }) => {
  const [hover, setHover] = useState(null);
  const data = useMemo(() => qpByStartMonth(inputs), [inputs]);
  const values = data.map((d) => d.qp).filter((v) => v !== null);
  if (!values.length) return null;

  const max = Math.max(...values) * 1.1;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / 12;
  const barW = slot - 6;
  const y = (v) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max].map((v) => Math.round(v * 100) / 100);
  const labelled = hover ?? selectedMonth;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-medium">Design pressure qp by start month</h3>
      <p className="mb-2 text-xs text-gray-500">Same duration and site. Equal bars mean the 20 m/s minimum governs.</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bar chart of qp in kPa for each installation month">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#6b7280">
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        <text x={4} y={PAD.top - 10} fontSize="9" fill="#6b7280">kPa</text>
        {data.map((d, i) => {
          if (d.qp === null) return null;
          const x = PAD.left + i * slot + 3;
          const selected = d.month === selectedMonth;
          const top = y(d.qp);
          return (
            <g
              key={d.month}
              onMouseEnter={() => setHover(d.month)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(d.month)}
              onBlur={() => setHover(null)}
              tabIndex={0}
            >
              <title>{`${MONTH_LABELS[i]}: qp = ${d.qp.toFixed(3)} kPa${d.vbMinGoverns ? " (20 m/s minimum governs)" : ""}`}</title>
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              <path
                d={barPath(x, top, barW, PAD.top + plotH - top)}
                fill={selected ? "#003A5D" : hover === d.month ? "#7895ab" : "#b9c8d4"}
              />
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="9" fill={selected ? "#111827" : "#6b7280"}>
                {MONTH_LABELS[i][0]}
              </text>
              {labelled === d.month && (
                <text x={x + barW / 2} y={top - 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#111827">
                  {d.qp.toFixed(3)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="#9ca3af" strokeWidth="1" />
      </svg>
    </div>
  );
};

export default ProgrammeChart;
