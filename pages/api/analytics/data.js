import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const dbName = session.user.databaseName;

    if (!dbName) {
        return res.status(400).json({ message: 'Database not found for user' });
    }

    try {
        const client = await clientPromise;
        const db = client.db(dbName);
        const subscriptions = await db.collection('subscriptions').find({}).toArray();

        // Process data for charts
        // 1. Category Distribution (or by Name if no categories)
        // For now, we'll group by name as we don't have explicit categories yet, 
        // but we can infer or just show top spenders.

        // Calculate monthly cost for each subscription
        const processedSubs = subscriptions.map(sub => {
            let monthlyCost = 0;
            const price = parseFloat(sub.price || 0);

            if (sub.billingCycle === 'Monthly') {
                monthlyCost = price;
            } else if (sub.billingCycle === 'Yearly') {
                monthlyCost = price / 12;
            } else if (sub.billingCycle === 'Weekly') {
                monthlyCost = price * 4.33;
            } else if (sub.billingCycle === 'Quarterly') {
                monthlyCost = price / 3;
            }

            return {
                name: sub.name,
                price: price,
                billingCycle: sub.billingCycle,
                monthlyCost: monthlyCost,
                category: sub.category || 'Uncategorized'
            };
        });

        // Sort by monthly cost descending
        processedSubs.sort((a, b) => b.monthlyCost - a.monthlyCost);

        // 2. Cumulative Spending Projection (Yearly)
        const cumulativeData = [];
        let total = 0;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const totalMonthly = processedSubs.reduce((acc, sub) => acc + sub.monthlyCost, 0);

        for (let i = 0; i < 12; i++) {
            total += totalMonthly;
            cumulativeData.push({
                month: months[i],
                amount: Math.round(total)
            });
        }

        res.status(200).json({
            subscriptions: processedSubs,
            totalMonthly: totalMonthly,
            cumulativeData: cumulativeData
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
