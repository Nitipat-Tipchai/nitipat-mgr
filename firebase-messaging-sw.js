importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase App
firebase.initializeApp({
  apiKey: "AIzaSyB7pGaPWn4n7NxrQ9l60V16u-qj05khqU8",
  authDomain: "mat-e-db476.firebaseapp.com",
  databaseURL: "https://mat-e-db476-default-rtdb.asia-southeast1.firebasedatabase.app",
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

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// ══════════════════════════════════════════════════
// PWA OFFLINE-FIRST ASSETS CACHING
// ══════════════════════════════════════════════════
const CACHE_NAME = 'nitipat-manager-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './auth.js',
  './firebase-bootstrap.js',
  './firebase-logic.js',
  './managers.js',
  './managers2.js',
  './state.js',
  './ilm-logic.js',
  './ilm-ui.js',
  './ui-dashboard.js',
  './ui-schedule.js',
  './ui-assignments.js',
  './ui-exams.js',
  './ui-grades.js',
  './ui-roadmap.js',
  './ui-calendar.js',
  './ui-focus.js',
  './ui-club.js',
  './ui-moneypod.js',
  './ui-settings.js',
  './ui-styles.js',
  './ui-forms.js',
  './ui-utils.js',
  './ui-drive.js',
  './ui-notion.js',
  './ui-core.js',
  './trial-reg.js',
  'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&family=Kanit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[sw.js] Prefetching static resources to cache');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[sw.js] Purging old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Avoid caching non-GET requests, Firebase internals, Auth SDKs, or GAS API requests
  if (
    event.request.method !== 'GET' ||
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.pathname.includes('exec')
  ) {
    return;
  }

  // CDN static assets: Cache-First Strategy
  if (
    url.origin.includes('cdnjs.cloudflare.com') ||
    url.origin.includes('unpkg.com') ||
    url.origin.includes('jsdelivr.net') ||
    url.origin.includes('fonts.googleapis.com') ||
    url.origin.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Application Shell: Network-First Strategy with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
