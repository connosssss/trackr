import React, { useState } from 'react';
import { useTheme } from "@/context/ThemeContext";

export const stringToColor = (str: string) => {
    let hash = 1;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const saturation = 65 + (Math.abs(hash) % 35);
    const lightness = 45 + (Math.abs(hash) % 20);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

interface ChartSegment {
    value: number;
    color: string;
    label: string;
}

interface ChartBar {
    label: string;
    total: number;
    segments: ChartSegment[];
}

interface CustomBarChartProps {
    data: ChartBar[];
    height?: number;
}

export default function CustomBarChart({ data, height = 400 }: CustomBarChartProps) {


    const { theme } = useTheme();
    const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
    const [hoveredSegmentIndex, setHoveredSegmentIndex] = useState<number | null>(null);
    const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);


    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full">No data available</div>;
    }



    const maxValue = Math.max(...data.map((d) => d.total));
    const yAxisMax = maxValue > 0 ? maxValue * 1.1 : 10;
    const chartHeight = height;

    const gridLines = [0, 1, 2, 3, 4].map(i => {

        const value = (yAxisMax / 4) * i;
        const y = chartHeight - (value / yAxisMax) * chartHeight;
        return { value, y };

    });


    const handleMouseMovement = (e: React.MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    return (

        <div
            className="w-full h-full relative select-none"
            style={{ height: `${height}px` }}
            onMouseMove={handleMouseMovement}
            onMouseLeave={() => {
                setHoveredBarIndex(null);
                setHoveredSegmentIndex(null);
                setMousePosition(null);
            }}
        >


            <svg width="100%" height="100%" className="overflow-visible">
                <g>
                    {gridLines.map((line, i) => (

                        <g key={i}>
                            <line
                                x1="0"
                                y1={line.y}
                                x2="100%"
                                y2={line.y}
                                stroke={theme === 'default' ? '#374151' : '#e5e7eb'}
                                strokeDasharray="3 3"
                            />

                            <text
                                x="-10"
                                y={line.y}
                                dy="4"
                                textAnchor="end"
                                fontSize="10"
                                fill={theme === 'default' ? '#9ca3af' : '#6b7280'}
                            >
                                {Math.round(line.value)}
                            </text>
                        </g>
                    ))}

                    <svg width="100%" height={chartHeight} x="0" y="0" className="overflow-visible">

                        {data.map((bar, i) => {

                            const barWidthPercentage = 100 / data.length;
                            const x = `${i * barWidthPercentage}%`;
                            const slotWidth = `${barWidthPercentage}%`;

                            let currentY = chartHeight;

                            return (
                                <g key={i} className="group">
                                    <text
                                        x={`${(i * barWidthPercentage) + (barWidthPercentage / 2)}%`}
                                        y={chartHeight + 20}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fill={theme === 'default' ? '#9ca3af' : '#6b7280'}
                                    >
                                        {bar.label}
                                    </text>

                                    <svg x={x} width={slotWidth} height={chartHeight} className="overflow-visible">
                                        <g transform={`translate(50%, 0) translate(-50%, 0)`} style={{ transformBox: 'fill-box' }}>
                                            {bar.segments.map((segment, j) => {
                                                const segmentHeight = (segment.value / yAxisMax) * chartHeight;
                                                const y = currentY - segmentHeight;
                                                currentY = y;

                                                return (
                                                    <rect
                                                        key={j}
                                                        x="10%"
                                                        y={y}
                                                        width="80%"
                                                        height={segmentHeight}
                                                        fill={segment.color}
                                                        rx={j === bar.segments.length - 1 ? 4 : 0}
                                                        ry={j === bar.segments.length - 1 ? 4 : 0}
                                                        onMouseEnter={() => {
                                                            setHoveredBarIndex(i);
                                                            setHoveredSegmentIndex(j);
                                                        }}
                                                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                                    />


                                                );
                                            })}

                                        </g>
                                    </svg>
                                </g>
                            );
                        })}
                    </svg>
                </g>
            </svg>

            {hoveredBarIndex !== null && hoveredSegmentIndex !== null && mousePosition && (

                <div
                    className={`fixed pointer-events-none z-50 px-3 py-2 rounded shadow-lg text-sm border ${theme === 'default'
                        ? 'bg-[#15181dff] border-[#374151] text-white'
                        : 'bg-white border-[#e5e7eb] text-black'
                        }`}
                    style={{
                        left: mousePosition.x + 15,
                        top: mousePosition.y + 15,
                    }}
                >
                    <div className="font-bold mb-1">{data[hoveredBarIndex].label}</div>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: data[hoveredBarIndex].segments[hoveredSegmentIndex].color }}
                        />
                        <span>{data[hoveredBarIndex].segments[hoveredSegmentIndex].label}:</span>
                        <span className="font-mono">{data[hoveredBarIndex].segments[hoveredSegmentIndex].value.toFixed(2)} hours</span>
                    </div>
                    <div className="mt-1 text-xs opacity-70 border-t pt-1 border-gray-600">
                        Total: {data[hoveredBarIndex].total.toFixed(2)} hours
                    </div>
                </div>
            )}
        </div>
    );
}
