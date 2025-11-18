import { getSession } from 'next-auth/react';
import { getUserDatabase } from '../../../lib/databaseFactory';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const email = session.user.email;
  const username = email.split('@')[0];

  try {
    const db = await getUserDatabase(username);
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};