"use client";

import React, { useRef, useState, useEffect } from "react";
import { PartialCVDetection } from "@/lib/ai/partial-cv-bridge";

interface DamageVisualizerProps {
  imageUrl: string;
  imageName: string;
  detections: PartialCVDetection[];
}

export function DamageVisualizer({ imageUrl, imageName, detections }: DamageVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState<{ scaleX: number; scaleY: number } | null>(null);
  const [selectedDamageId, setSelectedDamageId] = useState<number | null>(null);

  // Function to calculate scaling factor based on rendered size vs natural size
  const updateScale = () => {
    if (!imgRef.current) return;
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = imgRef.current;
    if (naturalWidth > 0 && naturalHeight > 0 && clientWidth > 0 && clientHeight > 0) {
      setScale({
        scaleX: clientWidth / naturalWidth,
        scaleY: clientHeight / naturalHeight,
      });
    }
  };

  useEffect(() => {
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="space-y-3">
      {/* Visual Bounding Box Overlay Canvas Container */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-950 flex items-center justify-center select-none group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt={imageName}
          onLoad={updateScale}
          className="max-h-[500px] w-auto max-w-full object-contain block mx-auto"
        />

        {/* Bounding Box Overlays */}
        {scale &&
          detections.map((det) => {
            const [x1, y1, x2, y2] = det.bbox;
            const left = x1 * scale.scaleX;
            const top = y1 * scale.scaleY;
            const width = (x2 - x1) * scale.scaleX;
            const height = (y2 - y1) * scale.scaleY;

            const isSelected = selectedDamageId === det.damage_id;

            const isSevere = det.severity === "Severe";
            const isModerate = det.severity === "Moderate";

            // Determine box colors based on severity
            const borderColor = isSevere
              ? "border-rose-500 bg-rose-500/15"
              : isModerate
              ? "border-amber-500 bg-amber-500/15"
              : "border-blue-400 bg-blue-400/15";

            const badgeColor = isSevere
              ? "bg-rose-600 text-white"
              : isModerate
              ? "bg-amber-600 text-white"
              : "bg-blue-600 text-white";

            return (
              <div
                key={det.damage_id}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                }}
                onClick={() => setSelectedDamageId((prev) => (prev === det.damage_id ? null : det.damage_id))}
                className={`border-2 rounded transition-all cursor-pointer ${borderColor} ${
                  isSelected ? "ring-2 ring-white shadow-lg z-20 scale-[1.01]" : "z-10 hover:opacity-100"
                }`}
              >
                {/* Floating Tag Label */}
                <div
                  className={`absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight shadow-md flex items-center gap-1 whitespace-nowrap uppercase ${badgeColor}`}
                >
                  <span>#{det.damage_id}</span>
                  <span className="opacity-90">{det.damage_type}</span>
                  <span className="opacity-75 text-[9px]">({(det.confidence * 100).toFixed(0)}%)</span>
                </div>
              </div>
            );
          })}
      </div>

      {/* Visual Instruction hint */}
      {detections.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Click any bounding box above or inspect damage details in the table below.</span>
          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            {detections.length} {detections.length === 1 ? "box" : "boxes"} rendered
          </span>
        </div>
      )}
    </div>
  );
}
