const CACHE='affirm-v3';
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
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="20"/><text y=".9em" x="10" font-size="80">✨</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="20"/><text y=".9em" x="10" font-size="80">✨</text></svg>',
    vibrate: [200, 100, 200],
    tag: data.tag || 'afirmacion-del-dia',
    renotify: true,
    data: { url: data.url || './index.html' }
  };
  e.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const urlToOpen = (e.notification.data && e.notification.data.url) || './index.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If there's already a window open, focus it
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// Periodic notification scheduling (for background sync)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay } = e.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100" rx="20"/><text y=".9em" x="10" font-size="80">✨</text></svg>',
        vibrate: [200, 100, 200],
        tag: 'afirmacion-scheduled'
      });
    }, delay);
  }
});
