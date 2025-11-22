import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SpendingChart({ data }) {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#444746" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="month"
                        stroke="#C4C7C5"
                        tick={{ fill: '#C4C7C5', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#C4C7C5"
                        tick={{ fill: '#C4C7C5', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#2D2D2D', border: '1px solid #444746', borderRadius: '8px', color: '#E3E3E3' }}
                        itemStyle={{ color: '#A8C7FA' }}
                        formatter={(value) => [`$${value}`, 'Cumulative Spend']}
                    />
                    <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#A8C7FA"
                        strokeWidth={3}
                        dot={{ fill: '#A8C7FA', r: 4 }}
                        activeDot={{ r: 6, fill: '#D3E3FD' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
