importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// 🚨 รบกวนคุณนำข้อมูลจาก Firebase Console มาวางตรงนี้ครับ
firebase.initializeApp({
  apiKey: "AIzaSyB7pGaPWn4n7NxrQ9l60V16u-qj05khqU8",
  authDomain: "mat-e-db476.firebaseapp.com",
  projectId: "mat-e-db476",
  storageBucket: "mat-e-db476.firebasestorage.app",
  messagingSenderId: "986910230630",
  appId: "1:986910230630:web:7b4b23ce828d18ab7bc5a7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title || 'NITIPAT MANAGER';
  const notificationOptions = {
    body: payload.notification.body || 'มีการแจ้งเตือนใหม่',
    icon: payload.notification.image || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    data: { url: payload.data ? payload.data.url : '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
