// Task Gifts Service Worker - Push Notifications & Offline Support
const CACHE_NAME = 'task-gifts-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests
  if (event.request.url.includes('/functions/') || event.request.url.includes('/rest/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // Clone and cache the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = { title: 'Task Gifts', body: 'Nova notificação!', icon: '/favicon.ico' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    vibrate: data.vibrate || [100, 50, 100],
    tag: data.tag || 'task-gifts-notification',
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
    timestamp: data.timestamp || Date.now(),
    silent: data.silent || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  let url = '/';

  // Handle different notification types
  switch (notificationData.type) {
    case 'achievement':
      url = '/achievements';
      break;
    case 'kudos':
      url = '/profile';
      break;
    case 'duel':
    case 'duel-challenge':
      url = '/duels';
      break;
    case 'quest':
      url = '/quests';
      break;
    case 'trail':
      url = notificationData.trailId ? `/trails/${notificationData.trailId}` : '/learning';
      break;
    case 'announcement':
      url = '/announcements';
      break;
    case 'checkin':
      url = '/attendance';
      break;
    case 'competency_gap':
    case 'development_tip':
      url = '/profile';
      break;
    case 'churn_alert':
      url = '/manager';
      break;
    // Security notifications
    case 'security_alert':
    case 'new_device':
    case 'ip_blocked':
    case 'failed_login':
      url = notificationData.url || '/security';
      break;
    default:
      url = notificationData.url || '/';
  }

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'view':
        url = notificationData.url || url;
        break;
      case 'dismiss':
        return;
      case 'accept':
        url = notificationData.acceptUrl || url;
        break;
      case 'decline':
        // Just close the notification
        return;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window and focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // If no window found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload;
    self.registration.showNotification(title, options);
  }

  if (event.data.type === 'CACHE_ASSETS') {
    const { assets } = event.data.payload;
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(assets);
    });
  }
});

// Background sync event (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-checkin') {
    event.waitUntil(syncCheckin());
  }

  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Sync pending check-ins when back online
async function syncCheckin() {
  try {
    const cache = await caches.open('task-gifts-offline-data');
    const pendingCheckins = await cache.match('pending-checkins');
    
    if (pendingCheckins) {
      const checkins = await pendingCheckins.json();
      // Send pending check-ins to server
      for (const checkin of checkins) {
        await fetch('/api/attendance/checkin', {
          method: 'POST',
          body: JSON.stringify(checkin),
          headers: { 'Content-Type': 'application/json' }
        });
      }
      await cache.delete('pending-checkins');
    }
  } catch (error) {
    console.error('[SW] Sync checkin error:', error);
  }
}

// Sync notifications when back online
async function syncNotifications() {
  try {
    // Fetch latest notifications from server
    const response = await fetch('/api/notifications/pending');
    const notifications = await response.json();
    
    for (const notif of notifications) {
      await self.registration.showNotification(notif.title, {
        body: notif.message,
        icon: '/favicon.ico',
        tag: notif.id,
        data: notif.data
      });
    }
  } catch (error) {
    console.error('[SW] Sync notifications error:', error);
  }
}

// Periodic background sync (for scheduled notifications)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'check-reminders') {
    event.waitUntil(checkReminders());
  }
});

async function checkReminders() {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    // Check-in reminder at 8:30 AM
    if (hour === 8 && now.getMinutes() >= 25 && now.getMinutes() <= 35) {
      await self.registration.showNotification('⏰ Hora do Check-in!', {
        body: 'Não esqueça de fazer seu check-in para manter o streak!',
        icon: '/favicon.ico',
        tag: 'checkin-reminder',
        requireInteraction: true,
        actions: [
          { action: 'checkin', title: 'Fazer Check-in' },
          { action: 'dismiss', title: 'Depois' }
        ],
        data: { type: 'checkin', url: '/attendance' }
      });
    }

    // Daily quiz reminder at 2 PM
    if (hour === 14 && now.getMinutes() >= 0 && now.getMinutes() <= 10) {
      await self.registration.showNotification('🧠 Quiz Diário Disponível!', {
        body: 'Teste seus conhecimentos e ganhe XP!',
        icon: '/favicon.ico',
        tag: 'quiz-reminder',
        data: { type: 'quiz', url: '/quiz' }
      });
    }
  } catch (error) {
    console.error('[SW] Check reminders error:', error);
  }
}

console.log('[SW] Service Worker loaded');
