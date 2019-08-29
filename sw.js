const dynamicCacheName = 'site-dynamic-v1';
const staticCacheName = 'site-static-v1';
const assets = [
    //requests URLs
    '/',
    '/index.html',
    '/js/app.js',
    '/js/ui.js',
    '/js/materialize.min.js',
    '/css/styles.css',
    '/css/materialize.min.css',
    '/img/dish.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
    '/pages/fallback.html'
];

//cache size limit function
const limitCacheSize = (name,size) => {
    caches.open(name).then(cache => {
        cache.keys().then(keys => {
            if (keys.length > size) {
                //deletes the first item from the array
                cache.delete(keys[0]).then(limitCacheSize(name,size));
            }
        })
    })
}



//install service worker
//fire the callback function when sw is installed
self.addEventListener('install', (evt) => {
    //console.log('installed');
    //pre cache, assync task, returns promisse
    //wait until this promisse is resolved, all the assets will be stored before the install event finishes
    evt.waitUntil(
        caches.open(staticCacheName).then(cache => {
            //it will look if the files are cached and try to retrieved from the cache, otherwise it will do a request do the server        
            cache.addAll(assets);
        })
    );
});

//activate event
self.addEventListener('activate', evt => {
    //console.log('activated');

    //delete old cache files
    evt.waitUntil(
        caches.keys().then(keys => {
            //take an array of promisses and wait for them to resolve, after this, returns one single promisse
            return Promise.all(keys
                //if returns true, it keeps in the new filtered array (stay in the array every name we want to delete)
                .filter(key => key !== staticCacheName && key !== dynamicCacheName)
                //caches.delete is assync, that's why it's a promisse, then we're returning a new array of promisses
                .map(key => caches.delete(key))
            )
        })
    );
});

//fetch event
self.addEventListener('fetch', (evt) => {
    //console.log('fetch event', evt);
    //respond from the cache
    evt.respondWith(
        //assync task
        caches.match(evt.request)
            .then(cacheResponse => {
                //cacheResponse will be empty if asset is not cached, if it's empy, add to the dynamic cache
                return cacheResponse || fetch(evt.request).then(fetchResponse => {
                    return caches.open(dynamicCacheName).then(cache => {
                        //key           //value
                        cache.put(evt.request.url, fetchResponse.clone());
                        //limit dynamic cache to 15 items
                        limitCacheSize(dynamicCacheName, 15);
                        return fetchResponse;
                    })
                })
            })
            .catch(() => {
                //do this only if user is opening a html page, not images,etc.
                if (evt.request.url.indexof('.html') > -1) {
                    return caches.match('/pages/fallback.html');
                }
            })
    )
});