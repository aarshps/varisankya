import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserDatabase } from "../../../lib/databaseFactory";

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    const { subscriptionName, location } = req.body;

    // Handle DELETE request for clearing cache
    if (req.method === 'DELETE') {
        const { subscriptionName: subNameDel } = req.query;
        if (!subNameDel) return res.status(400).json({ message: 'Subscription name required' });

        try {
            const db = await getUserDatabase(session.user.email);
            await db.collection('insights_cache').deleteOne({
                userId: session.user.email,
                subscriptionName: subNameDel
            });
            return res.status(200).json({ message: 'Cache cleared' });
        } catch (error) {
            console.error('Cache Clear Error:', error);
            return res.status(500).json({ message: 'Failed to clear cache' });
        }
    }

    if (!subscriptionName) {
        return res.status(400).json({ message: 'Subscription name is required' });
    }

    try {
        const db = await getUserDatabase(session.user.email);
        const cacheCollection = db.collection('insights_cache');

        // Check cache
        const cachedResult = await cacheCollection.findOne({
            userId: session.user.email,
            subscriptionName: subscriptionName,
            // Simple 1-hour cache validity check
            createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) }
        });

        if (cachedResult) {
            return res.status(200).json({ insight: cachedResult.data, cached: true });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-3-pro-preview as per user request
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

        let locationStr = 'User Location: United States (Default)';
        if (location) {
            if (location.latitude && location.longitude) {
                locationStr = `User Location: ${location.latitude}, ${location.longitude}`;
            } else if (location.country) {
                locationStr = `User Location: ${location.country}`;
            }
        }

        const prompt = `
      Act as a subscription research expert.
      Target Subscription: "${subscriptionName}"
      ${locationStr}

      Please provide a detailed but VERY CONCISE research report on this subscription service.
      Return ONLY a valid JSON object with the following structure (no markdown formatting):
      {
        "description": "A very short, 1-sentence overview.",
        "estimatedCost": "Estimated monthly cost (e.g. '$15.99/mo').",
        "features": ["Feature 1", "Feature 2", "Feature 3"],
        "alternatives": ["Alt 1", "Alt 2"],
        "officialWebsite": "URL to the official website or pricing page."
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up any potential markdown code blocks from the response
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonResponse = JSON.parse(text);

        // Store in cache
        await cacheCollection.updateOne(
            { userId: session.user.email, subscriptionName: subscriptionName },
            {
                $set: {
                    data: jsonResponse,
                    createdAt: new Date(),
                    location: location
                }
            },
            { upsert: true }
        );

        res.status(200).json({ insight: jsonResponse, cached: false });

    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ message: 'Failed to generate insights' });
    }
}
