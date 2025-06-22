"use client";
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import React from "react";

interface PieChartDisplayProps {
    breakdown: Array<{ id: string; name: string; balance: number }>;
    colors?: string[];
    labelFormatter?: (name: string, balance: number) => string;
    width?: number;
    height?: number;
    outerRadius?: number;
}

const DEFAULT_COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#fa8072', '#b0e0e6', '#f08080',
];

function shortenName(name: string, maxLen = 10) {
    if (!name) return '';
    return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
}

export default function PieChartDisplay({
    breakdown,
    colors = DEFAULT_COLORS,
    labelFormatter,
    width = 520,
    height = 330,
    outerRadius = 130
}: PieChartDisplayProps) {
    const renderLabel = ({ name, balance }: { name: string, balance: number }) => {
        if (labelFormatter) return labelFormatter(name, balance);
        return `${shortenName(name)}: ${balance.toFixed(2)}`;
    };
    return (
        <PieChart width={width} height={height}>
            <Pie
                data={breakdown}
                dataKey="balance"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={outerRadius}
                label={renderLabel}
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
