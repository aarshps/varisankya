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
      console.log('[API] GET /subscriptions - Fetching all...');
      const subscriptions = await collection.find({}).toArray();
      console.log(`[API] GET /subscriptions - Found ${subscriptions.length} items.`);

      // Normalize `_id` to string and sanitize fields
      const normalized = subscriptions.map(s => ({
        _id: s._id.toString(),
        name: s.name,
        cost: s.cost,
        currency: s.currency,
        billingCycle: s.billingCycle,
        customDays: s.customDays,
        customMonths: s.customMonths,
        category: s.category,
        notes: s.notes,
        nextDueDate: s.nextDueDate,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }));

      if (normalized.length > 0) {
        console.log('[API] GET /subscriptions - Sample sanitized item:', JSON.stringify(normalized[0], null, 2));
      }

      res.status(200).json(normalized);
    } catch (error) {
      console.error('[API] Error fetching subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  } else if (req.method === 'POST') {
    console.log('[API] POST /subscriptions - Body:', JSON.stringify(req.body, null, 2));
    const { name, nextDueDate, cost, currency, billingCycle, customDays, category, notes } = req.body;

    if (!name) {
      console.warn('[API] POST /subscriptions - Missing name');
      return res.status(400).json({ error: 'Subscription name is required' });
    }

    try {
      const newSubscription = {
        name,
        cost: cost ? parseFloat(cost) : 0,
        currency: currency || 'USD',
        billingCycle: billingCycle || 'monthly',
        customDays: customDays ? parseInt(customDays) : null,
        customMonths: req.body.customMonths ? parseInt(req.body.customMonths) : null,
        category: category || 'Other',
        notes: notes || '',
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        createdAt: new Date(),
      };
      console.log('[API] POST /subscriptions - Creating:', JSON.stringify(newSubscription, null, 2));

      const result = await collection.insertOne(newSubscription);
      console.log('[API] POST /subscriptions - Inserted ID:', result.insertedId);

      res.status(201).json({ ...newSubscription, _id: result.insertedId.toString() });
    } catch (error) {
      console.error('[API] Error adding subscription:', error);
      res.status(500).json({ error: 'Failed to add subscription' });
    }
  } else if (req.method === 'PUT') {
    console.log('[API] PUT /subscriptions - Body:', JSON.stringify(req.body, null, 2));
    // Accept either id or _id (MongoDB standard)
    const id = req.body.id || req.body._id;
    const { name, nextDueDate, cost, currency, billingCycle, customDays, category, notes } = req.body;

    if (!id) {
      console.warn('[API] PUT /subscriptions - Missing ID');
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    try {
      const updateData = {
        name,
        cost: cost !== undefined ? parseFloat(cost) : undefined,
        currency,
        billingCycle,
        customDays: customDays ? parseInt(customDays) : null,
        customMonths: req.body.customMonths ? parseInt(req.body.customMonths) : null,
        category,
        notes,
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        updatedAt: new Date(),
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      // Fields to remove from the document (legacy fields)
      const unsetFields = {
        lastPaidDate: "",
        recurrenceType: "",
        recurrenceValue: "",
        status: "",
        startDate: ""
      };

      console.log('[API] PUT /subscriptions - Update Data:', JSON.stringify(updateData, null, 2));
      console.log('[API] PUT /subscriptions - Unset Fields:', JSON.stringify(unsetFields, null, 2));

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: updateData,
          $unset: unsetFields
        }
      );

      console.log('[API] PUT /subscriptions - Update Result:', JSON.stringify({ matched: result.matchedCount, modified: result.modifiedCount }, null, 2));

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      res.status(200).json({ ...updateData, _id: id });
    } catch (error) {
      console.error('[API] Error updating subscription:', error);
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.query;
    console.log(`[API] DELETE /subscriptions - ID: ${id}`);

    if (!id) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    try {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      console.log('[API] DELETE /subscriptions - Result:', JSON.stringify({ deleted: result.deletedCount }, null, 2));

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      res.status(200).json({ message: 'Subscription deleted successfully' });
    } catch (error) {
      console.error('[API] Error deleting subscription:', error);
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