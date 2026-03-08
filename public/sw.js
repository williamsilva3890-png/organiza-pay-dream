// OrganizaPay Service Worker — handles push notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push events from server
self.addEventListener("push", (event) => {
  let data = { title: "OrganizaPay", body: "Você tem uma nova notificação!", icon: "/icon-192.png", url: "/dashboard" };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-192.png",
      tag: data.title,
      data: { url: data.url || "/dashboard" },
    })
  );
});

// Listen for notification messages from the app (fallback)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: event.data.title,
      renotify: false,
    });
  }
});

// When user clicks notification, open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
