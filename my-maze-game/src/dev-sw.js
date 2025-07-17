// empty service worker for dev
// NOTE: This file should be copied to public/dev-sw.js for Next.js to serve it.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim()); 