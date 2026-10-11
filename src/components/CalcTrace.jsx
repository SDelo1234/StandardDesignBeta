import React from "react";
import { formatTraceValue } from "../utils/designBrief";

/** Step-by-step calculation with clause references (same rows as the PDF). */
const CalcTrace = ({ result }) => {
  if (!result?.ok) return null;
  return (
    <details className="rounded-2xl bg-white p-5 shadow-sm" open>
      <summary className="cursor-pointer text-lg font-medium">Calculation</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 pr-3">Symbol</th>
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 pr-3 text-right">Value</th>
              <th className="py-2">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {result.trace.map((row) => (
              <tr key={row.symbol} className={row.symbol === "qp" ? "font-semibold" : undefined}>
                <td className="py-2 pr-3 font-mono text-xs">{row.symbol}</td>
                <td className="py-2 pr-3">
                  {row.label}
                  {row.note && <div className="text-xs text-gray-500">{row.note}</div>}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">{formatTraceValue(row)}</td>
                <td className="py-2 text-xs text-gray-600">{row.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Calculation engine v{result.engineVersion}. Fence capacities are peak velocity pressures; cp,net is included in
        the fence system design.
      </p>
    </details>
  );
};

export default CalcTrace;
