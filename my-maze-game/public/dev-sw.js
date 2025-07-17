// empty service worker for dev
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim()); 