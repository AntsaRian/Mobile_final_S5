console.log('🔥 Firebase Messaging Service Worker chargé');

importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD1m-HY_WJQ-tTOJJsyoX3uKcPPy402ERA",
  authDomain: "mcd-mobile-web-jeu.firebaseapp.com",
  projectId: "mcd-mobile-web-jeu",
  storageBucket: "mcd-mobile-web-jeu.firebasestorage.app",
  messagingSenderId: "566668437976",
  appId: "1:566668437976:web:8e109f28fbcfe40e79aaad"
});

const messaging = firebase.messaging();

console.log('✅ Firebase Messaging initialisé dans le SW');

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 📨 Message reçu en arrière-plan:', payload);
  
  // ========================================
  // ENVOYER LE MESSAGE À L'APP IONIC
  // ========================================
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      console.log('[SW] 📤 Envoi du message au client:', client.url);
      client.postMessage({
        type: 'firebase-notification',
        payload: payload
      });
    });
  });
  
  // Afficher aussi la notification système
  if (payload.notification) {
    const notificationTitle = payload.notification.title || 'Nouvelle notification';
    const notificationOptions = {
      body: payload.notification.body || '',
      icon: payload.notification.icon || '/icon.png',
      badge: '/badge-icon.png',
      vibrate: [200, 100, 200],
      tag: 'fcm-notification-' + Date.now(),
      data: payload.data || {},
      requireInteraction: false,
      timestamp: Date.now()
    };
    
    console.log('[SW] 🔔 Affichage de la notification:', notificationTitle);
    return self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Notification cliquée:', event.notification);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Chercher une fenêtre existante
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Ouvrir une nouvelle fenêtre si aucune n'existe
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Service Worker installé');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Service Worker activé');
  event.waitUntil(clients.claim());
});