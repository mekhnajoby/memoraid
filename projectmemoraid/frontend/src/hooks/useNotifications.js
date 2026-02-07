import { useEffect } from 'react';
import { messaging, requestForToken, onMessageListener } from '../firebase';
import api from '../services/api';

/**
 * Hook to manage browser notifications:
 * 1. Requests permission
 * 2. Generates/Refreshes FCM token
 * 3. Registers token with backend
 * 4. Listens for foreground messages
 */
const useNotifications = (user) => {
    useEffect(() => {
        if (!user || !messaging) return;

        const setupNotifications = async () => {
            try {
                // 1. Request Permission & Get Token
                const token = await requestForToken();

                if (token) {
                    // 2. Register token with backend
                    // We use a dedicated endpoint to save the FCM token linked to the user
                    await api.post('users/fcm-token/', {
                        token: token,
                        device_id: window.navigator.userAgent // Basic device identification
                    });
                    console.log("Push notifications registered successfully.");
                }
            } catch (err) {
                console.error("Failed to setup notifications:", err);
            }
        };

        setupNotifications();

        // 3. Listen for foreground messages
        const unsubscribe = onMessageListener().then((payload) => {
            console.log("Foreground notification received:", payload);

            // Show a simple browser notification if the app is in foreground
            if (Notification.permission === 'granted') {
                new Notification(payload.notification.title, {
                    body: payload.notification.body,
                    icon: '/logo.png', // Ensure this exists in public/
                });
            }
        }).catch(err => console.log('failed: ', err));

        return () => {
            // Clean up listener if needed (FCM Web SDK handles most of this)
        };
    }, [user]);

    return null;
};

export default useNotifications;
