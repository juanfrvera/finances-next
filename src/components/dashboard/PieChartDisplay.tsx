"use client";
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import React from "react";

interface PieChartDisplayProps {
    breakdown: Array<{ id: string; name: string; balance: number }>;
    colors?: string[];
    width?: number;
    height?: number;
    outerRadius?: number;
}

const DEFAULT_COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#fa8072', '#b0e0e6', '#f08080',
];

export default function PieChartDisplay({
    breakdown,
    colors = DEFAULT_COLORS,
    width = 520,
    height = 330,
    outerRadius = 130
}: PieChartDisplayProps) {
    return (
        <PieChart width={width} height={height}>
            <Pie
                data={breakdown}
                dataKey="balance"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={outerRadius}
                labelLine={false}
            >
                {breakdown.map((entry, idx) => (
                    <Cell key={`cell-${entry.id}`} fill={colors[idx % colors.length]} />
                ))}
            </Pie>
            <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)}`} />
            <Legend />
        </PieChart>
    );
}
