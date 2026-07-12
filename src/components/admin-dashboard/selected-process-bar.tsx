"use client";

import { useEffect, useState } from "react";

export function SelectedProcessBar({ percent }: { percent: number }) {
  const [width, setWidth] = useState("0%");
  const clampedPercent = Math.max(0, Math.min(100, percent));

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setWidth(`${clampedPercent}%`);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [clampedPercent]);

  return (
    <div
      className="h-3.5 rounded-r-[4px] bg-gradient-to-r from-[#34D399] via-[#10B981] to-[#059669] shadow-[0_1px_3px_rgba(16,185,129,0.24)] ring-1 ring-[#10B98126] transition-[width,filter,box-shadow] duration-700 ease-out [will-change:width] hover:brightness-[1.03] hover:shadow-[0_2px_6px_rgba(16,185,129,0.3)] motion-reduce:transition-none"
      style={{ width }}
    />
  );
}
