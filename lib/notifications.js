import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL_ID = 'due_subscriptions';
const GROUP_ID = 'due_subscriptions_group';

export const initializeNotifications = async () => {
    try {
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
            const newPerms = await LocalNotifications.requestPermissions();
            if (newPerms.display !== 'granted') return false;
        }

        // Create channel for Android
        await LocalNotifications.createChannel({
            id: CHANNEL_ID,
            name: 'Due Subscriptions',
            description: 'Notifications for subscriptions due soon',
            importance: 5, // High importance for heads-up
            visibility: 1,
            vibration: true,
        });

        return true;
    } catch (error) {
        console.error('Error initializing notifications:', error);
        return false;
    }
};

export const scheduleDueNotifications = async (subscriptions) => {
    try {
        const hasPermission = await initializeNotifications();
        if (!hasPermission) return;

        // Cancel all pending notifications to avoid duplicates/stale data
        // In a real app, we might want to be smarter, but this ensures sync
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
        }

        const notifications = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        subscriptions.forEach((sub) => {
            if (sub.active === false || !sub.nextDueDate) return;

            const dueDate = new Date(sub.nextDueDate);
            dueDate.setHours(0, 0, 0, 0);

            const diffTime = dueDate - now;
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Logic: "Red" when daysLeft <= 8
            // We want to notify if it IS red (<= 8 days) OR schedule for when it BECOMES red (8 days before)

            // 1. If currently in range (0 <= daysLeft <= 8)
            if (daysLeft >= 0 && daysLeft <= 8) {
                notifications.push({
                    title: 'Subscription Due Soon',
                    body: `${sub.name} is due in ${daysLeft} days (${sub.currency} ${sub.cost})`,
                    id: Math.abs(hashCode(sub._id + '-current')), // Unique ID
                    schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
                    channelId: CHANNEL_ID,
                    group: GROUP_ID,
                    smallIcon: 'ic_launcher', // Use app icon
                    extra: { subscriptionId: sub._id }
                });
            }

            // 2. Schedule for future "Red" state (8 days before due)
            // Only if that date is in the future
            const redDate = new Date(dueDate);
            redDate.setDate(dueDate.getDate() - 8);
            redDate.setHours(9, 0, 0, 0); // 9:00 AM

            if (redDate > new Date()) {
                notifications.push({
                    title: 'Subscription Due Soon',
                    body: `${sub.name} is due in 8 days (${sub.currency} ${sub.cost})`,
                    id: Math.abs(hashCode(sub._id + '-future')),
                    schedule: { at: redDate },
                    channelId: CHANNEL_ID,
                    group: GROUP_ID,
                    smallIcon: 'ic_launcher',
                    extra: { subscriptionId: sub._id }
                });
            }
        });

        if (notifications.length > 0) {
            // Add a summary notification for Android grouping if multiple
            if (notifications.length > 1) {
                // Android automatically groups if 'group' ID is same, 
                // but we can add a summary item if needed. 
                // For now, let's rely on system grouping which is cleaner.
            }

            await LocalNotifications.schedule({ notifications });
            console.log(`Scheduled ${notifications.length} notifications`);
        }

    } catch (error) {
        console.error('Error scheduling notifications:', error);
    }
};

// Simple hash function for generating integer IDs from strings
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}
