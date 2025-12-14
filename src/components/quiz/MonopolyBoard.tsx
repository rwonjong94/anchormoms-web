"use client";

import React, { useMemo } from 'react';

interface MonopolyBoardProps {
  totalTiles?: number;
  currentTile?: number; // 0-based index
  size?: number; // px
}

export default function MonopolyBoard({ totalTiles = 20, currentTile = 0, size = 320 }: MonopolyBoardProps) {
  const radius = useMemo(() => (size / 2) - 24, [size]);
  const center = useMemo(() => ({ x: size / 2, y: size / 2 }), [size]);

  const tiles = useMemo(() => Array.from({ length: totalTiles }, (_, i) => i), [totalTiles]);

  const polarToCartesian = (angleRad: number, r: number) => {
    return {
      x: center.x + r * Math.cos(angleRad),
      y: center.y + r * Math.sin(angleRad)
    };
  };

  const tileAngle = (i: number) => (i / totalTiles) * Math.PI * 2 - Math.PI / 2; // start at top

  const tokenPos = polarToCartesian(tileAngle(Math.max(0, currentTile % totalTiles)), radius);

  return (
    <div className="w-full flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
        {/* Outer ring */}
        <circle cx={center.x} cy={center.y} r={radius} fill="none" stroke="currentColor" className="text-gray-300 dark:text-gray-600" strokeWidth={8} />

        {/* Tiles as small markers */}
        {tiles.map((i) => {
          const a = tileAngle(i);
          const pos = polarToCartesian(a, radius);
          const isActive = i === (currentTile % totalTiles);
          return (
            <circle
              key={i}
              cx={pos.x}
              cy={pos.y}
              r={isActive ? 6 : 4}
              fill={isActive ? '#2563eb' : '#9ca3af'}
              className={isActive ? 'transition-all' : ''}
            />
          );
        })}

        {/* Token */}
        <g className="transition-transform duration-500">
          <circle cx={tokenPos.x} cy={tokenPos.y} r={10} fill="#f59e0b" stroke="#b45309" strokeWidth={2} />
          {/* eyes */}
          <circle cx={tokenPos.x - 3} cy={tokenPos.y - 2} r={1.5} fill="#000" />
          <circle cx={tokenPos.x + 3} cy={tokenPos.y - 2} r={1.5} fill="#000" />
        </g>

        {/* Center label */}
        <text x={center.x} y={center.y} textAnchor="middle" dominantBaseline="middle" className="fill-gray-700 dark:fill-gray-200" fontSize={14}>
          Quiz Journey
        </text>
      </svg>
    </div>
  );
}


