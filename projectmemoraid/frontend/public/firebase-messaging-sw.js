importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// IMPORTANT: These values are now filled with your Firebase Web Config values.
firebase.initializeApp({
    apiKey: "AIzaSyB1E4K34SRLvgy6MtPsV1G6azMQhWQ9lwg",
    authDomain: "memoraid2026.firebaseapp.com",
    projectId: "memoraid2026",
    storageBucket: "memoraid2026.firebasestorage.app",
    messagingSenderId: "622586072278",
    appId: "1:622586072278:web:5b6c852dad966e3000cd77"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
