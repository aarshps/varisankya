import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#A8C7FA', '#F2B8B5', '#C7F089', '#FDD663', '#E8DEF8', '#F9D7E5'];

export default function CategoryPieChart({ data }) {
    // Take top 5 and group rest as "Other"
    const processedData = React.useMemo(() => {
        if (!data || data.length === 0) return [];

        const sorted = [...data].sort((a, b) => b.monthlyCost - a.monthlyCost);

        if (sorted.length <= 5) return sorted;

        const top5 = sorted.slice(0, 5);
        const otherCost = sorted.slice(5).reduce((acc, curr) => acc + curr.monthlyCost, 0);

        return [...top5, { name: 'Other', monthlyCost: otherCost }];
    }, [data]);

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={processedData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="monthlyCost"
                        stroke="none"
                    >
                        {processedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#2D2D2D', border: '1px solid #444746', borderRadius: '8px', color: '#E3E3E3' }}
                        formatter={(value) => [`$${value.toFixed(2)}`, 'Monthly Cost']}
                    />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ color: '#C4C7C5', fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
