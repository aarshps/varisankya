import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getUserDatabase } from '../../../lib/databaseFactory';
import { validateUserDatabase } from '../../../lib/dbValidation';
import { ObjectId } from 'mongodb';
import appConfig from '../../../lib/config';

export default async function handler(req, res) {
  // 1. Get the user's session
  const session = await getServerSession(req, res, authOptions);

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
    // Ensure the user's database exists and is accessible (non-creating check)
    const dbValid = await validateUserDatabase(username);
    if (!dbValid) {
      console.error(`[Subscriptions API] Database validation failed for user: ${username}`);
      return res.status(401).json({ error: 'Database not accessible - please log in again' });
    }

    // Get user-specific database
    db = await getUserDatabase(username);

    // Log and validate the database name being used
    const expectedDbName = appConfig.getDatabaseName(username);

    // Validate that we're using the correct database
    if (db.databaseName !== expectedDbName) {
      console.error(`[Subscriptions API] Database name mismatch. Expected: ${expectedDbName}, Got: ${db.databaseName}`);
      return res.status(401).json({ error: 'Database validation failed - please log in again' });
    }

    // Test the database connection by attempting a read operation
    // This ensures the database is accessible
    await db.command({ ping: 1 });
  } catch (error) {
    console.error('[Subscriptions API] Database access error:', error);
    // Log the user out if database access fails
    return res.status(401).json({ error: 'Database access error - please log in again' });
  }

  const collection = db.collection('subscriptions');

  if (req.method === 'GET') {
    try {
      const subscriptions = await collection.find({}).toArray();
      // Normalize `_id` to string for client consumption and consistency with POST responses
      const normalized = subscriptions.map(s => ({ ...s, _id: s._id.toString() }));
      res.status(200).json(normalized);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  } else if (req.method === 'POST') {
    const { name, nextDueDate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Subscription name is required' });
    }

    try {
      const newSubscription = {
        name,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        createdAt: new Date(),
      };

      const result = await collection.insertOne(newSubscription);
      res.status(201).json({ ...newSubscription, _id: result.insertedId.toString() });
    } catch (error) {
      console.error('Error adding subscription:', error);
      res.status(500).json({ error: 'Failed to add subscription' });
    }
  } else if (req.method === 'PUT') {
    const { id, name, nextDueDate } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    try {
      const updateData = {
        name,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        updatedAt: new Date(),
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      res.status(200).json({ ...updateData, _id: id });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ error: 'Failed to update subscription' });
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
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
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