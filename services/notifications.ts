// Notification Service for AQI Alerts
// Works on Web (PWA) and Android (Capacitor)

export interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
}

class NotificationService {
    private hasPermission: boolean = false;
    private lastNotificationTime: number = 0;
    private minInterval: number = 5 * 60 * 1000; // 5 minutes between notifications

    // Request notification permission
    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.log('[Notifications] Not supported in this browser');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.hasPermission = true;
            return true;
        }

        if (Notification.permission === 'denied') {
            console.log('[Notifications] Permission denied');
            return false;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        this.hasPermission = permission === 'granted';
        console.log(`[Notifications] Permission: ${permission}`);
        return this.hasPermission;
    }

    // Check if notifications are supported and permitted
    isEnabled(): boolean {
        return 'Notification' in window && Notification.permission === 'granted';
    }

    // Send a notification
    async notify(options: NotificationOptions): Promise<void> {
        // Don't spam notifications
        const now = Date.now();
        if (now - this.lastNotificationTime < this.minInterval) {
            console.log('[Notifications] Skipping - too soon since last notification');
            return;
        }

        if (!this.isEnabled()) {
            await this.requestPermission();
            if (!this.hasPermission) return;
        }

        try {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/logo.png',
                tag: options.tag || 'aqi-alert',
                requireInteraction: options.requireInteraction || false,
                badge: '/logo.png',
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            this.lastNotificationTime = now;
            console.log(`[Notifications] Sent: ${options.title}`);
        } catch (error) {
            console.error('[Notifications] Failed:', error);
        }
    }

    // Send AQI alert notification based on level
    async sendAQIAlert(aqi: number, location: string = 'Your location'): Promise<void> {
        let title: string;
        let body: string;

        if (aqi >= 300) {
            title = '🚨 HAZARDOUS AIR QUALITY';
            body = `AQI ${aqi} at ${location}. Stay indoors! Health emergency.`;
        } else if (aqi >= 200) {
            title = '⚠️ Very Unhealthy Air';
            body = `AQI ${aqi} at ${location}. Avoid outdoor activities.`;
        } else if (aqi >= 150) {
            title = '⚠️ Unhealthy Air Quality';
            body = `AQI ${aqi} at ${location}. Sensitive groups should stay indoors.`;
        } else {
            // Don't notify for moderate/good AQI
            return;
        }

        await this.notify({
            title,
            body,
            requireInteraction: aqi >= 300, // Critical alerts stay visible
            tag: `aqi-${aqi >= 300 ? 'critical' : 'warning'}`,
        });
    }
}

// Singleton instance
export const notificationService = new NotificationService();

// Register service worker for background notifications (PWA)
export const registerServiceWorker = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('[SW] Registered:', registration.scope);
        } catch (error) {
            console.log('[SW] Registration failed:', error);
        }
    }
};
