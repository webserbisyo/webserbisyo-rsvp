import type { PushSubscriptionActionInput, PushSubscriptionStatus } from "@/types/notifications";

export function getBrowserPushStatus(vapidPublicKey: string | null): PushSubscriptionStatus {
  if (!vapidPublicKey) {
    return "not_configured";
  }

  if (typeof window === "undefined") {
    return "unsupported";
  }

  if (
    !("Notification" in window) ||
    !("PushManager" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return "unsupported";
  }

  if (Notification.permission === "denied") {
    return "blocked";
  }

  return "off";
}

export async function subscribeBrowserToPush(
  vapidPublicKey: string,
): Promise<PushSubscriptionActionInput> {
  if (!("Notification" in window)) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Push notification permission was not granted.");
  }

  const registration = await getServiceWorkerRegistration();
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      userVisibleOnly: true,
    }));

  return serializePushSubscription(subscription);
}

export async function unsubscribeBrowserFromPush() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return null;
  }

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  return endpoint;
}

async function getServiceWorkerRegistration() {
  const existingRegistration = await navigator.serviceWorker.getRegistration("/");

  if (existingRegistration) {
    return existingRegistration;
  }

  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });

  return navigator.serviceWorker.ready;
}

function serializePushSubscription(subscription: PushSubscription): PushSubscriptionActionInput {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!p256dh || !auth) {
    throw new Error("Push subscription keys are missing.");
  }

  return {
    auth,
    endpoint: subscription.endpoint,
    p256dh,
    platform: getPushPlatform(),
    userAgent: navigator.userAgent,
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function getPushPlatform() {
  const userAgent = navigator.userAgent;

  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return "ios";
  }

  if (/Android/.test(userAgent)) {
    return "android";
  }

  if (/Macintosh/.test(userAgent)) {
    return "macos";
  }

  if (/Windows/.test(userAgent)) {
    return "windows";
  }

  return "web";
}
