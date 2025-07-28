"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useCurrencyEvolution, type CurrencyEvolutionDataPoint } from "@/hooks/useCurrencyEvolution";

interface CurrencyEvolutionChartProps {
    currency: string;
}

// Tooltip props type for Recharts
interface TooltipProps {
    active?: boolean;
    payload?: Array<{
        payload: CurrencyEvolutionDataPoint;
        value: number;
    }>;
    label?: string;
}

// Custom tooltip component
function CustomTooltip({ active, payload }: TooltipProps) {
    if (active && payload && payload.length) {
        const data = payload[0].payload as CurrencyEvolutionDataPoint;
        const formattedValue = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(data.value);

        return (
            <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                <p className="font-medium text-foreground mb-2">
                    {new Date(data.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                    Total: <span className="font-medium text-foreground">{formattedValue}</span>
                </p>
                {data.topAccounts.length > 0 && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Top Contributors:</p>
                        {data.topAccounts.map((account, idx) => (
                            <p key={idx} className="text-xs text-muted-foreground">
                                {account.name}: {account.balance.toFixed(2)}
                            </p>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    return null;
}

export default function CurrencyEvolutionChart({ currency }: CurrencyEvolutionChartProps) {
    const { data, isLoading, error } = useCurrencyEvolution(currency);

    if (isLoading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading evolution chart...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="text-sm text-destructive">Failed to load evolution data</div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="text-sm text-muted-foreground text-center">
                    <p>No transaction history</p>
                    <p className="text-xs mt-1">Chart will appear once transactions are added</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                        <linearGradient id="evolutionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.4} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="date"
                        fontSize={11}
                        tick={{ fill: 'var(--muted-foreground)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                    />
                    <YAxis
                        fontSize={11}
                        tick={{ fill: 'var(--muted-foreground)' }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                        tickFormatter={(value) => {
                            // Format large numbers with K/M abbreviations
                            if (Math.abs(value) >= 1000000) {
                                return `${(value / 1000000).toFixed(1)}M`;
                            } else if (Math.abs(value) >= 1000) {
                                return `${(value / 1000).toFixed(1)}K`;
                            }
                            return value.toFixed(0);
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey="value"
                        fill="url(#evolutionGradient)"
                        stroke="var(--primary)"
                        strokeWidth={1}
                        radius={[2, 2, 0, 0]}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.value >= 0 ? "url(#evolutionGradient)" : "var(--destructive)"}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
