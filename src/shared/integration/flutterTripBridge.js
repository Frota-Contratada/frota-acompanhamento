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

export class FlutterTripBridge {
  constructor(targetWindow = window) {
    this.window = targetWindow;
    this.listeners = new Set();
    this.seenEventIds = new Set();
    this.pendingEvents = [];
    this.started = false;
    this.readySent = false;
    this.context = null;
    this.previousCompatibilityHandler = null;
    this.onContextEvent = (event) => this.acceptContext(event.detail);
    this.onTripEvent = (event) => this.acceptMessage(event.detail);
  }

  isEmbedded() {
    return typeof this.window.FlutterTripBridge?.postMessage === 'function';
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
    this.window.addEventListener('flutter.context', this.onContextEvent);
    this.window.addEventListener('flutter.trip', this.onTripEvent);
    this.previousCompatibilityHandler = this.window.FrotaTripBridge?.onMessage;
    this.window.FrotaTripBridge = {
      ...(this.window.FrotaTripBridge || {}),
      onMessage: (message) => this.acceptMessage(message)
    };
    if (this.window.FrotaNativeContext) this.acceptContext(this.window.FrotaNativeContext);
    return true;
  }

  stop() {
    if (!this.started) return;
    this.window.removeEventListener('flutter.context', this.onContextEvent);
    this.window.removeEventListener('flutter.trip', this.onTripEvent);
    if (this.window.FrotaTripBridge) {
      this.window.FrotaTripBridge.onMessage = this.previousCompatibilityHandler;
    }
    this.started = false;
  }

  acceptContext(rawContext) {
    let context = rawContext;
    if (typeof context === 'string') {
      try { context = JSON.parse(context); } catch { return false; }
    }
    if (!context || context.schemaVersion !== TRIP_SCHEMA_VERSION || typeof context.tripId !== 'string' || !context.tripId) {
      return false;
    }
    this.context = context;
    if (!this.readySent) {
      this.readySent = Boolean(this.send('web.ready', {}));
    }
    return true;
  }

  acceptMessage(rawMessage) {
    if (!this.context) return false;
    try {
      const message = parseFlutterEnvelope(rawMessage, this.context.tripId);
      if (!FROM_FLUTTER_TYPES.has(message.type) || this.seenEventIds.has(message.eventId)) return false;
      this.seenEventIds.add(message.eventId);
      if (this.seenEventIds.size > 500) {
        this.seenEventIds.delete(this.seenEventIds.values().next().value);
      }
      if (!this.listeners.size) this.pendingEvents.push(message);
      else this.listeners.forEach((listener) => listener(message));
      return true;
    } catch (error) {
      console.warn('Mensagem inválida recebida do Flutter:', error.message);
      return false;
    }
  }

  send(type, payload = {}) {
    if (!this.isEmbedded() || !this.context || !TO_FLUTTER_TYPES.has(type)) return null;
    if (type === 'external.navigationRequested') validateExternalNavigationPayload(payload);
    const envelope = {
      schemaVersion: TRIP_SCHEMA_VERSION,
      type,
      eventId: createEventId(this.window),
      tripId: this.context.tripId,
      sentAt: new Date().toISOString(),
      payload
    };
    this.window.FlutterTripBridge.postMessage(JSON.stringify(envelope));
    return envelope.eventId;
  }
}

export function createFlutterTripBridge(targetWindow = window) {
  return new FlutterTripBridge(targetWindow);
}
