"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import React from "react";

interface PieChartDisplayProps {
    breakdown: Array<{ id: string; name: string; percentage: number }>;
    colors?: string[];
    labelFormatter?: (name: string, percentage: number) => string;
}

const DEFAULT_COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#fa8072', '#b0e0e6', '#f08080',
];

function shortenName(name: string, maxLen = 10) {
    if (!name) return '';
    return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name;
}

export default function PieChartDisplay({ breakdown, colors = DEFAULT_COLORS, labelFormatter }: PieChartDisplayProps) {
    const renderLabel = ({ name, percentage }: { name: string, percentage: number }) => {
        if (labelFormatter) return labelFormatter(name, percentage);
        return `${shortenName(name)}: ${percentage.toFixed(1)}%`;
    };
    return (
        <ResponsiveContainer width={520} height={330}>
            <PieChart>
                <Pie
                    data={breakdown}
                    dataKey="percentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    label={renderLabel}
                >
                    {breakdown.map((entry, idx) => (
                        <Cell key={`cell-${entry.id}`} fill={colors[idx % colors.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
