import test from 'node:test';
import assert from 'node:assert/strict';
import { FlutterTripBridge } from '../src/shared/integration/flutterTripBridge.js';

class FakeWindow extends EventTarget {
  constructor() {
    super();
    this.messages = [];
    this.crypto = { randomUUID: () => '00000000-0000-4000-8000-000000000001' };
    this.FlutterTripBridge = {
      postMessage: (message) => this.messages.push(JSON.parse(message))
    };
    this.FrotaNativeContext = { schemaVersion: 1, tripId: 'trip-1' };
  }
}

function locationEnvelope(eventId, timestamp = '2026-08-24T18:00:00.000Z') {
  return {
    schemaVersion: 1,
    type: 'vehicle.location',
    eventId,
    tripId: 'trip-1',
    sentAt: '2026-08-24T18:00:01.000Z',
    payload: { lat: -23.5, lng: -46.6, accuracy: 5, speed: 8, heading: 90, timestamp }
  };
}

test('envia web.ready com o tripId apenas após obter o contexto nativo', () => {
  const fakeWindow = new FakeWindow();
  const bridge = new FlutterTripBridge(fakeWindow);
  assert.equal(bridge.start(), true);
  assert.equal(fakeWindow.messages.length, 1);
  assert.equal(fakeWindow.messages[0].type, 'web.ready');
  assert.equal(fakeWindow.messages[0].tripId, 'trip-1');
});

test('deduplica o mesmo evento entregue pelos dois mecanismos Flutter', () => {
  const fakeWindow = new FakeWindow();
  const bridge = new FlutterTripBridge(fakeWindow);
  const received = [];
  bridge.subscribe((message) => received.push(message));
  bridge.start();

  const message = locationEnvelope('event-location');
  bridge.acceptMessage(message);
  fakeWindow.FrotaTripBridge.onMessage(message);
  assert.equal(received.length, 1);
});

test('não envia comandos sem transporte ou contexto válido', () => {
  const fakeWindow = new FakeWindow();
  delete fakeWindow.FrotaNativeContext;
  const bridge = new FlutterTripBridge(fakeWindow);
  bridge.start();
  assert.equal(bridge.send('waiting.confirmed', {}), null);
  assert.equal(fakeWindow.messages.length, 0);
});

