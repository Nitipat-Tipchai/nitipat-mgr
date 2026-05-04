self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'แจ้งเตือนใหม่', body: 'คุณมีข้อความใหม่' };
  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
