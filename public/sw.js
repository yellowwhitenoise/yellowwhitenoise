self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === "string" ? data.title : "Yellow White Noise";
  const body =
    typeof data.body === "string" ? data.body : "Something new just dropped.";
  const url =
    typeof data.url === "string" &&
    (data.url.startsWith("/") || data.url.startsWith("https://"))
      ? data.url
      : "/";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/favicon.png",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        for (const window of windows) {
          if (window.url === url || window.url.endsWith(url)) {
            return window.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
