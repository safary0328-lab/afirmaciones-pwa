const CACHE='affirm-v4';
const ASSETS=['./index.html','./manifest.json','./musica_loop.mp3'];
self.addEventListener('install',e=>{
e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
self.skipWaiting();
});
self.addEventListener('activate',e=>{
e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
self.clients.claim();
});
self.addEventListener('fetch',e=>{
e.respondWith(fetch(e.request).then(r=>{
if(r&&r.status===200){
const clone=r.clone();
caches.open(CACHE).then(c=>c.put(e.request,clone));
}
return r;
}).catch(()=>caches.match(e.request)));
});

// ═══════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════
self.addEventListener('push', e => {
  let data = { title: '✨ Afirmación del día', body: 'Toca para ver tu afirmación' };
  if (e.data) {
    try { data = e.data.json(); } catch(err) { data.body = e.data.text(); }
  }
  const options = {
    body: data.body,
    icon: data.icon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="20"/><text y=".9em" x="10" font-size="80">✨</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="20"/><text y=".9em" x="10" font-size="80">✨</text></svg>',
    image: data.image || undefined,
    vibrate: [200, 100, 200],
    tag: data.tag || 'afirmacion-del-dia',
    renotify: true,
    silent: false,
    actions: [
      { action: 'favorite', title: '❤️ Favorita' },
      { action: 'next', title: '▶️ Otra' },
      { action: 'speak', title: '🔊 Escuchar' }
    ],
    data: {
      affirmation: data.affirmation || '',
      author: data.author || '',
      url: data.url || './index.html'
    }
  };
  e.waitUntil(self.registration.showNotification(data.title, options));
});

// ═══════════════════════════════════════════
// NOTIFICATION CLICK - ACCIONES
// ═══════════════════════════════════════════
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'favorite') {
    // Guardar en favoritos via mensaje al cliente
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'FAVORITE_AFFIRMATION',
            affirmation: data.affirmation || ''
          });
        });
        // Si no hay clientes abiertos, abrir la app
        if (clients.length === 0) {
          return self.clients.openWindow(data.url || './index.html');
        }
      })
    );
  } else if (action === 'next') {
    // Mostrar otra afirmación
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEXT_AFFIRMATION'
          });
        });
        if (clients.length === 0) {
          return self.clients.openWindow(data.url || './index.html');
        }
      })
    );
  } else if (action === 'speak') {
    // Hablar afirmación
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SPEAK_AFFIRMATION',
            text: data.affirmation || ''
          });
        });
        if (clients.length === 0) {
          return self.clients.openWindow(data.url || './index.html');
        }
      })
    );
  } else {
    // Click en la notificación (sin acción) - abrir la app
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          if (client.url.includes('index.html') && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(data.url || './index.html');
      })
    );
  }
});

// ═══════════════════════════════════════════
// MENSAJES DEL CLIENTE
// ═══════════════════════════════════════════
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="20"/><text y=".9em" x="10" font-size="80">✨</text></svg>',
        vibrate: [200, 100, 200],
        tag: 'afirmacion-scheduled',
        actions: [
          { action: 'favorite', title: '❤️ Favorita' },
          { action: 'next', title: '▶️ Otra' },
          { action: 'speak', title: '🔊 Escuchar' }
        ],
        data: { affirmation: '', author: '', url: './index.html' }
      });
    }, delay);
  }
  
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    // Programar múltiples notificaciones desde el cliente
    const { settings } = e.data;
    // Esto se maneja desde el cliente con setTimeout
  }
});
