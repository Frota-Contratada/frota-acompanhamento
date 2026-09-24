import test from 'node:test';
import assert from 'node:assert/strict';

import { WebParentTripBridge } from '../src/shared/integration/webParentTripBridge.js';

class FakeParent {
  constructor() {
    this.messages = [];
  }

  postMessage(message, targetOrigin) {
    this.messages.push({ message, targetOrigin });
  }
}

class FakeWebWindow extends EventTarget {
  constructor() {
    super();
    this.parent = new FakeParent();
    this.location = { origin: 'https://tracking.exemplo.com.br' };
    this.crypto = { randomUUID: () => '00000000-0000-4000-8000-000000000001' };
  }

  receive(data, origin = 'https://portal.exemplo.com.br') {
    const event = new Event('message');
    Object.defineProperties(event, {
      data: { value: data },
      origin: { value: origin },
      source: { value: this.parent }
    });
    this.dispatchEvent(event);
  }
}

function locationEnvelope(eventId) {
  return {
    schemaVersion: 1,
    type: 'vehicle.location',
    eventId,
    tripId: 'trip-web-1',
    sentAt: '2026-09-02T15:00:01.000Z',
    payload: {
      lat: -23.5,
      lng: -46.6,
      accuracy: 5,
      speed: 8,
      heading: 90,
      timestamp: '2026-09-02T15:00:00.000Z'
    }
  };
}

test('realiza handshake com a aplicação web autorizada', () => {
  const fakeWindow = new FakeWebWindow();
  const bridge = new WebParentTripBridge(fakeWindow, {
    allowedOrigins: ['https://portal.exemplo.com.br']
  });
  assert.equal(bridge.start(), true);
  fakeWindow.receive({ schemaVersion: 1, type: 'trip.context', tripId: 'trip-web-1' });
  assert.equal(fakeWindow.parent.messages.length, 1);
  assert.equal(fakeWindow.parent.messages[0].message.type, 'web.ready');
  assert.equal(fakeWindow.parent.messages[0].targetOrigin, 'https://portal.exemplo.com.br');
});

test('rejeita contexto enviado por uma origem não autorizada', () => {
  const fakeWindow = new FakeWebWindow();
  const bridge = new WebParentTripBridge(fakeWindow, {
    allowedOrigins: ['https://portal.exemplo.com.br']
  });
  bridge.start();
  fakeWindow.receive(
    { schemaVersion: 1, type: 'trip.context', tripId: 'trip-web-1' },
    'https://site-malicioso.example'
  );
  assert.equal(fakeWindow.parent.messages.length, 0);
  assert.equal(bridge.context, null);
});

test('recebe eventos da corrida e envia comandos ao parent', () => {
  const fakeWindow = new FakeWebWindow();
  const bridge = new WebParentTripBridge(fakeWindow, {
    allowedOrigins: ['https://portal.exemplo.com.br']
  });
  const received = [];
  bridge.subscribe((message) => received.push(message));
  bridge.start();
  fakeWindow.receive({ schemaVersion: 1, type: 'trip.context', tripId: 'trip-web-1' });
  fakeWindow.receive(locationEnvelope('location-1'));
  assert.equal(received.length, 1);
  assert.equal(received[0].type, 'vehicle.location');

  const commandId = bridge.send('waiting.confirmed', {});
  assert.ok(commandId);
  assert.equal(fakeWindow.parent.messages.at(-1).message.type, 'waiting.confirmed');
});

test('accepts the HML parent and rejects a lookalike origin', () => {
  const fakeWindow = new FakeWebWindow();
  const bridge = new WebParentTripBridge(fakeWindow, {
    allowedOrigins: ['http://frota.local', 'https://frota-contratada.hml.seara.com.br']
  });
  bridge.start();
  fakeWindow.receive(
    { schemaVersion: 1, type: 'trip.context', tripId: 'trip-web-1' },
    'https://frota-contratada.hml.seara.com.br.evil.example'
  );
  assert.equal(bridge.context, null);
  fakeWindow.receive(
    { schemaVersion: 1, type: 'trip.context', tripId: 'trip-web-1' },
    'https://frota-contratada.hml.seara.com.br'
  );
  assert.equal(bridge.trustedOrigin, 'https://frota-contratada.hml.seara.com.br');
  assert.equal(fakeWindow.parent.messages[0].targetOrigin, bridge.trustedOrigin);
});
