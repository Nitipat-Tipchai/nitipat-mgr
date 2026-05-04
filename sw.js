importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "REPLACED_BY_APP_JS",
  authDomain: "REPLACED_BY_APP_JS",
  projectId: "REPLACED_BY_APP_JS",
  storageBucket: "REPLACED_BY_APP_JS",
  messagingSenderId: "REPLACED_BY_APP_JS",
  appId: "REPLACED_BY_APP_JS"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
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
