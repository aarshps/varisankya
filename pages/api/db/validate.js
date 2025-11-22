import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { validateUserDatabase } from '../../../lib/dbValidation';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ valid: false });
  }

  const email = session.user?.email;
  if (!email) {
    return res.status(400).json({ error: 'User email not found in session' });
  }

  const username = email.split('@')[0];

  try {
    const valid = await validateUserDatabase(username);
    if (!valid) {
      return res.status(401).json({ valid: false });
    }
    return res.status(200).json({ valid: true });
  } catch (error) {
    console.error('[DB Validate API] Error validating DB:', error);
    return res.status(500).json({ error: 'Failed to validate database' });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
