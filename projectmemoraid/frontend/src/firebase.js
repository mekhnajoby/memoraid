import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let messaging = null;

// Only initialize if we have at least an API key
console.log("Firebase API Key present:", !!firebaseConfig.apiKey);
if (firebaseConfig.apiKey) {
    try {
        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
        console.log("Firebase Messaging initialized successfully");
    } catch (err) {
        console.warn("Firebase initialization failed:", err);
    }
} else {
    console.warn("Firebase configuration missing. VITE_FIREBASE_API_KEY is null.");
}

export const requestForToken = async () => {
    if (!messaging) return null;
    try {
        const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
        if (currentToken) {
            console.log('FCM Token generated:', currentToken);
            return currentToken;
        } else {
            console.log('No registration token available.');
            return null;
        }
    } catch (err) {
        console.log('An error occurred while retrieving token. ', err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return;
        onMessage(messaging, (payload) => {
            console.log("Payload received: ", payload);
            resolve(payload);
        });
    });

export { messaging };
