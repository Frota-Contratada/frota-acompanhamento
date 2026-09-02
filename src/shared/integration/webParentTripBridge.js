import {
  FROM_FLUTTER_TYPES,
  TO_FLUTTER_TYPES,
  TRIP_SCHEMA_VERSION,
  parseFlutterEnvelope,
  validateExternalNavigationPayload
} from './tripContract.js';

function createEventId(targetWindow) {
  if (targetWindow.crypto?.randomUUID) return targetWindow.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function parseMessage(data) {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function normalizeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

export class WebParentTripBridge {
  constructor(targetWindow = window, { allowedOrigins = [] } = {}) {
    this.window = targetWindow;
    this.parentWindow = targetWindow.parent;
    this.allowedOrigins = new Set(
      allowedOrigins.map(normalizeOrigin).filter(Boolean)
    );
    this.listeners = new Set();
    this.seenEventIds = new Set();
    this.pendingEvents = [];
    this.context = null;
    this.trustedOrigin = null;
    this.started = false;
    this.readySent = false;
    this.onWindowMessage = (event) => this.acceptWindowMessage(event);
  }

  isEmbedded() {
    return Boolean(this.parentWindow && this.parentWindow !== this.window);
  }

  isAllowedOrigin(origin) {
    if (this.allowedOrigins.size) return this.allowedOrigins.has(origin);
    return origin === this.window.location?.origin;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    if (this.pendingEvents.length) {
      const pending = this.pendingEvents.splice(0);
      pending.forEach((message) => listener(message));
    }
    return () => this.listeners.delete(listener);
  }

  start() {
    if (this.started || !this.isEmbedded()) return false;
    this.started = true;
    this.window.addEventListener('message', this.onWindowMessage);
    return true;
  }

  stop() {
    if (!this.started) return;
    this.window.removeEventListener('message', this.onWindowMessage);
    this.started = false;
  }

  acceptWindowMessage(event) {
    if (event.source !== this.parentWindow) return false;
    const message = parseMessage(event.data);
    if (!message || typeof message !== 'object') return false;

    if (!this.context) {
      if (
        message.type !== 'trip.context'
        || message.schemaVersion !== TRIP_SCHEMA_VERSION
        || typeof message.tripId !== 'string'
        || !message.tripId
        || !this.isAllowedOrigin(event.origin)
      ) return false;

      this.context = {
        schemaVersion: TRIP_SCHEMA_VERSION,
        tripId: message.tripId
      };
      this.trustedOrigin = event.origin;
      if (!this.readySent) this.readySent = Boolean(this.send('web.ready', {}));
      return true;
    }

    if (event.origin !== this.trustedOrigin) return false;
    return this.acceptTripMessage(message);
  }

  acceptTripMessage(message) {
    try {
      const envelope = parseFlutterEnvelope(message, this.context.tripId);
      if (!FROM_FLUTTER_TYPES.has(envelope.type) || this.seenEventIds.has(envelope.eventId)) {
        return false;
      }
      this.seenEventIds.add(envelope.eventId);
      if (this.seenEventIds.size > 500) {
        this.seenEventIds.delete(this.seenEventIds.values().next().value);
      }
      if (!this.listeners.size) this.pendingEvents.push(envelope);
      else this.listeners.forEach((listener) => listener(envelope));
      return true;
    } catch (error) {
      console.warn('Mensagem inválida recebida da aplicação web:', error.message);
      return false;
    }
  }

  send(type, payload = {}) {
    if (
      !this.isEmbedded()
      || !this.context
      || !this.trustedOrigin
      || !TO_FLUTTER_TYPES.has(type)
    ) return null;
    if (type === 'external.navigationRequested') {
      validateExternalNavigationPayload(payload);
    }
    const envelope = {
      schemaVersion: TRIP_SCHEMA_VERSION,
      type,
      eventId: createEventId(this.window),
      tripId: this.context.tripId,
      sentAt: new Date().toISOString(),
      payload
    };
    this.parentWindow.postMessage(envelope, this.trustedOrigin);
    return envelope.eventId;
  }
}

export function createWebParentTripBridge(targetWindow = window, options = {}) {
  return new WebParentTripBridge(targetWindow, options);
}
