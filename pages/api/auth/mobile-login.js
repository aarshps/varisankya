import { OAuth2Client } from 'google-auth-library';
import { encode } from 'next-auth/jwt';
import config from '../../../lib/config';
import { validateUserDatabase } from "../../../lib/dbValidation";
import { getUserDatabase } from "../../../lib/databaseFactory";

const client = new OAuth2Client(config.CLIENT_ID);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'Missing idToken' });
        }

        // 1. Verify the ID Token with Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: config.CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { email, name, picture, sub: googleId } = payload;
        const username = email.split('@')[0];

        // 2. Create/Update User in Database (Same logic as NextAuth callback)
        try {
            const dbValid = await validateUserDatabase(username);
            if (!dbValid) {
                const db = await getUserDatabase(username);
                const usersCollection = db.collection('users');
                await usersCollection.updateOne(
                    { email },
                    {
                        $set: {
                            name: name || username,
                            image: picture || null,
                            lastLogin: new Date(),
                            username: username,
                        },
                        $setOnInsert: {
                            createdAt: new Date(),
                        },
                    },
                    { upsert: true }
                );
            }
        } catch (dbError) {
            console.error('Error syncing user to DB:', dbError);
            // Continue even if DB sync fails, as auth is valid
        }

        // 3. Create JWT Token for NextAuth
        const token = {
            name: name || username,
            email: email,
            picture: picture,
            sub: googleId,
            username: username,
            dbAccessValid: true,
            accessToken: idToken, // Storing idToken as accessToken for consistency
        };

        // 4. Encode the token using NextAuth's secret
        const encodedToken = await encode({
            token,
            secret: config.NEXTAUTH_SECRET,
        });

        // 5. Set the Session Cookie manually
        // We use the standard cookie name expected by NextAuth
        const cookieName = 'next-auth.session-token';

        // Determine cookie options based on environment (mimicking our dynamic policy)
        // Since this is a direct API call from the app, we can be explicit
        const isSecure = process.env.NODE_ENV === 'production';

        // IMPORTANT: For the native app, we want SameSite=None to ensure it persists
        // But since we are setting it via a direct API response to a fetch call,
        // the WebView will handle it.

        res.setHeader('Set-Cookie', [
            `${cookieName}=${encodedToken}; Path=/; HttpOnly; SameSite=Lax; Secure=${isSecure}; Max-Age=${30 * 24 * 60 * 60}`
        ]);

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Mobile login error:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
}
