"use client";

import { useState } from "react";

export default function TagPrintButton({
  tagCode,
  printed: initialPrinted,
}: {
  tagCode: number;
  printed: boolean;
}) {
  const [printed, setPrinted] = useState(initialPrinted);
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    if (printed || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/tags/${tagCode}/print`, { method: "POST" });
      if (!r.ok) {
        const data = await r.json();
        alert(data.error || "Print failed");
        return;
      }
      setPrinted(true);
      // Open the image for printing
      const printWin = window.open(`/api/tags/${tagCode}/image`, "_blank");
      if (printWin) {
        printWin.addEventListener("load", () => {
          printWin.print();
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (printed) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gray-900 border border-gray-800 text-gray-500 text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Already printed
      </div>
    );
  }

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="w-full py-3 px-4 rounded-lg bg-amber-700 text-white font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      {loading ? "Printing..." : "Print Tag"}
    </button>
  );
}
