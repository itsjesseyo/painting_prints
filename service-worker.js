// Paint2Print Service Worker
// UPDATE THIS VERSION NUMBER WHEN RELEASING UPDATES TO FORCE CACHE REFRESH
const APP_VERSION = '1.0.2';

const CACHE_NAME = `paint2print-v${APP_VERSION}`;
const STATIC_CACHE_NAME = `paint2print-static-v${APP_VERSION}`;
const DYNAMIC_CACHE_NAME = `paint2print-dynamic-v${APP_VERSION}`;

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/mobile.css',
    '/js/app.js',
    '/js/utils.js',
    '/js/image-processor.js',
    '/js/upscaler.js',
    '/js/ui-controller.js',
    '/js/pwa-install.js',
    '/manifest.json',
    '/assets/icon-192.svg',
    '/assets/icon-512.svg',
    '/assets/icon-1024.svg'
];

// Large files to cache on first use
const DYNAMIC_FILES = [
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js',
    'https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-thick@latest/dist/umd/2x.min.js',
    'https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-thick@latest/dist/umd/3x.min.js',
    'https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-thick@latest/dist/umd/4x.min.js',
    'https://cdn.jsdelivr.net/npm/upscaler@1.0.0-beta.19/dist/browser/umd/upscaler.min.js',
    '/opencv.js'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker: Install event');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('Service Worker: Failed to cache static files', err);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activate event');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-http requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Handle different types of requests
    if (STATIC_FILES.includes(url.pathname)) {
        // Static files - cache first
        event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    } else if (DYNAMIC_FILES.some(file => request.url.includes(file) || file.includes(request.url))) {
        // Dynamic files (AI models, libraries) - cache first, then network
        event.respondWith(cacheFirst(request, DYNAMIC_CACHE_NAME));
    } else if (request.method === 'GET') {
        // Other GET requests - network first, then cache
        event.respondWith(networkFirst(request));
    }
    // POST requests and other methods - always go to network
});

// Cache first strategy
async function cacheFirst(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cached = await cache.match(request);
        
        if (cached) {
            console.log('Service Worker: Serving from cache', request.url);
            return cached;
        }
        
        console.log('Service Worker: Fetching from network', request.url);
        const response = await fetch(request);
        
        if (response.ok) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('Service Worker: Cache first failed', error);
        return new Response('Offline', { status: 503 });
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        console.log('Service Worker: Network first', request.url);
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache', request.url);
        
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        return new Response('Offline', { status: 503 });
    }
}

// Background sync for uploads (future enhancement)
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync', event.tag);
    
    if (event.tag === 'upload-photo') {
        event.waitUntil(uploadPhoto());
    }
});

async function uploadPhoto() {
    // Future: Handle background photo uploads
    console.log('Service Worker: Background photo upload');
}

// Push notifications (future enhancement)
self.addEventListener('push', event => {
    console.log('Service Worker: Push received', event);
    
    const options = {
        body: event.data ? event.data.text() : 'Photo processing complete!',
        icon: '/assets/icon-192.png',
        badge: '/assets/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Paint2Print', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification click');
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Update available notification
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Periodic background sync (future enhancement)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'cleanup-cache') {
        event.waitUntil(cleanupCache());
    }
});

async function cleanupCache() {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const requests = await cache.keys();
    
    // Remove old entries (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
            const dateHeader = response.headers.get('date');
            if (dateHeader && new Date(dateHeader).getTime() < sevenDaysAgo) {
                await cache.delete(request);
            }
        }
    }
}