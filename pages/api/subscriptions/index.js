import { getSession } from 'next-auth/react';
import { getUserDb } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // Check if user is authenticated
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Extract username from session
  const email = session.user?.email;
  if (!email) {
    return res.status(400).json({ error: 'User email not found in session' });
  }

  // Extract username from email (before @ symbol)
  const username = email.split('@')[0];
  let db;

  try {
    // Get user-specific database
    db = await getUserDb(username);
  } catch (error) {
    console.error('Database access error:', error);
    return res.status(500).json({ error: 'Database access error' });
  }

  const collection = db.collection('subscriptions');

  if (req.method === 'GET') {
    try {
      const subscriptions = await collection.find({}).toArray();
      res.status(200).json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  } else if (req.method === 'POST') {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Subscription name is required' });
    }

    try {
      const result = await collection.insertOne({ name });
      res.status(201).json({ id: result.insertedId.toString(), name });
    } catch (error) {
      console.error('Error adding subscription:', error);
      res.status(500).json({ error: 'Failed to add subscription' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    try {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      res.status(200).json({ message: 'Subscription deleted successfully' });
    } catch (error) {
      console.error('Error deleting subscription:', error);
      res.status(500).json({ error: 'Failed to delete subscription' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};