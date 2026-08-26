export const TRIP_SCHEMA_VERSION = 1;

export const FROM_FLUTTER_TYPES = new Set([
  'trip.bootstrap',
  'vehicle.location',
  'passenger.location',
  'route.replaced',
  'trip.statusChanged',
  'waiting.changed',
  'connection.changed',
  'command.succeeded',
  'command.failed'
]);

export const TO_FLUTTER_TYPES = new Set([
  'web.ready',
  'route.rerouteRequested',
  'waiting.confirmed',
  'waiting.resumeRequested',
  'trip.finishRequested',
  'external.navigationRequested',
  'web.log'
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function requireCondition(condition, message) {
  if (!condition) throw new TypeError(message);
}

export function validateExternalNavigationPayload(payload) {
  requireCondition(isRecord(payload), 'Navegação externa inválida.');
  requireCondition(payload.provider === 'google_maps' || payload.provider === 'waze', 'Provedor de navegação inválido.');
  validateWaypoint(payload.destination, 'destination');
  if (payload.origin != null) {
    requireCondition(isRecord(payload.origin), 'Origem da navegação inválida.');
    requireCondition(
      isFiniteNumber(payload.origin.lat) && payload.origin.lat >= -90 && payload.origin.lat <= 90
        && isFiniteNumber(payload.origin.lng) && payload.origin.lng >= -180 && payload.origin.lng <= 180,
      'Coordenadas da origem da navegação inválidas.'
    );
  }
  return payload;
}

export function validatePosition(position, label = 'posição') {
  requireCondition(isRecord(position), `${label} inválida.`);
  requireCondition(isFiniteNumber(position.lat) && position.lat >= -90 && position.lat <= 90, `Latitude de ${label} inválida.`);
  requireCondition(isFiniteNumber(position.lng) && position.lng >= -180 && position.lng <= 180, `Longitude de ${label} inválida.`);
  requireCondition(isValidDate(position.timestamp), `Timestamp de ${label} inválido.`);
  return position;
}

function validateWaypoint(point, expectedKind) {
  requireCondition(isRecord(point), `Ponto ${expectedKind} inválido.`);
  requireCondition(typeof point.id === 'string' && point.id.length > 0, `ID do ponto ${expectedKind} inválido.`);
  requireCondition(Number.isInteger(point.sequence), `Sequência do ponto ${expectedKind} inválida.`);
  requireCondition(point.kind === expectedKind, `Tipo do ponto ${expectedKind} inválido.`);
  requireCondition(typeof point.label === 'string', `Nome do ponto ${expectedKind} inválido.`);
  requireCondition(
    isFiniteNumber(point.lat) && point.lat >= -90 && point.lat <= 90
      && isFiniteNumber(point.lng) && point.lng >= -180 && point.lng <= 180,
    `Coordenadas do ponto ${expectedKind} inválidas.`
  );
}

export function validateCanonicalRoute(route) {
  requireCondition(isRecord(route), 'Rota canônica inválida.');
  requireCondition(typeof route.routeId === 'string' && route.routeId.length > 0, 'ID da rota inválido.');
  requireCondition(Number.isInteger(route.version) && route.version >= 1, 'Versão da rota inválida.');
  requireCondition(isValidDate(route.calculatedAt), 'Data de cálculo da rota inválida.');
  validateWaypoint(route.origin, 'origin');
  validateWaypoint(route.destination, 'destination');
  requireCondition(Array.isArray(route.stops), 'Paradas da rota inválidas.');
  route.stops.forEach((stop) => validateWaypoint(stop, 'stop'));
  requireCondition(Array.isArray(route.coordinates) && route.coordinates.length >= 2, 'Traçado da rota inválido.');
  route.coordinates.forEach((point) => {
    requireCondition(
      isRecord(point)
        && isFiniteNumber(point.lat) && point.lat >= -90 && point.lat <= 90
        && isFiniteNumber(point.lng) && point.lng >= -180 && point.lng <= 180,
      'Coordenada da rota inválida.'
    );
  });
  requireCondition(Number.isInteger(route.distanceMeters) && route.distanceMeters >= 0, 'Distância da rota inválida.');
  requireCondition(Number.isInteger(route.durationSeconds) && route.durationSeconds >= 0, 'Duração da rota inválida.');
  requireCondition(Number.isInteger(route.trafficDelaySeconds) && route.trafficDelaySeconds >= 0, 'Atraso da rota inválido.');
  requireCondition(Array.isArray(route.trafficSections), 'Trechos de trânsito inválidos.');
  route.trafficSections.forEach((section) => {
    requireCondition(isRecord(section), 'Trecho de trânsito inválido.');
    requireCondition(Number.isInteger(section.startIndex) && Number.isInteger(section.endIndex), 'Índices do trânsito inválidos.');
    requireCondition(section.startIndex >= 0 && section.endIndex < route.coordinates.length && section.endIndex >= section.startIndex, 'Trecho de trânsito fora da rota.');
    requireCondition(Number.isInteger(section.delaySeconds) && section.delaySeconds >= 0, 'Atraso do trecho inválido.');
    requireCondition(typeof section.category === 'string', 'Categoria de trânsito inválida.');
  });
  requireCondition(Array.isArray(route.instructions), 'Instruções da rota inválidas.');
  route.instructions.forEach((instruction) => {
    requireCondition(isRecord(instruction), 'Instrução da rota inválida.');
    requireCondition(typeof instruction.id === 'string', 'ID da instrução inválido.');
    requireCondition(typeof instruction.instruction === 'string', 'Texto da instrução inválido.');
    requireCondition(typeof instruction.streetName === 'string', 'Nome da via inválido.');
    requireCondition(Number.isInteger(instruction.distanceMeters) && instruction.distanceMeters >= 0, 'Distância da instrução inválida.');
    requireCondition(Number.isInteger(instruction.durationSeconds) && instruction.durationSeconds >= 0, 'Duração da instrução inválida.');
    requireCondition(typeof instruction.type === 'string', 'Tipo da instrução inválido.');
    requireCondition(Number.isInteger(instruction.coordinateIndex), 'Índice da instrução inválido.');
    requireCondition(instruction.coordinateIndex >= 0 && instruction.coordinateIndex < route.coordinates.length, 'Índice da instrução fora da rota.');
    requireCondition(isRecord(instruction.location), 'Local da instrução inválido.');
    requireCondition(
      isFiniteNumber(instruction.location.lat) && instruction.location.lat >= -90 && instruction.location.lat <= 90
        && isFiniteNumber(instruction.location.lng) && instruction.location.lng >= -180 && instruction.location.lng <= 180,
      'Coordenada da instrução inválida.'
    );
  });
  return route;
}

export function adaptCanonicalRoute(route) {
  validateCanonicalRoute(route);
  const coordinateCount = route.coordinates.length;

  return {
    success: true,
    provider: 'canonical',
    routeId: route.routeId,
    version: route.version,
    calculatedAt: route.calculatedAt,
    origin: route.origin,
    stops: [...route.stops].sort((a, b) => a.sequence - b.sequence),
    destination: route.destination,
    coordinates: route.coordinates.map(({ lat, lng }) => [lat, lng]),
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    trafficDelaySeconds: Math.max(0, Number(route.trafficDelaySeconds) || 0),
    trafficSections: (route.trafficSections || []).map((section) => ({
      startPointIndex: Math.max(0, Math.min(coordinateCount - 1, Number(section.startIndex) || 0)),
      endPointIndex: Math.max(0, Math.min(coordinateCount - 1, Number(section.endIndex) || 0)),
      delayInSeconds: Math.max(0, Number(section.delaySeconds) || 0),
      simpleCategory: section.category || 'unknown'
    })),
    steps: route.instructions.map((instruction) => ({
      id: instruction.id,
      instruction: instruction.instruction,
      rawName: instruction.streetName || '',
      streetName: instruction.streetName || '',
      distanceMeters: Math.max(0, Number(instruction.distanceMeters) || 0),
      durationSeconds: Math.max(0, Number(instruction.durationSeconds) || 0),
      type: instruction.type,
      modifier: instruction.modifier ?? null,
      icon: instruction.icon ?? null,
      location: [instruction.location.lat, instruction.location.lng],
      coordIndex: instruction.coordinateIndex,
      coordinateIndex: instruction.coordinateIndex
    }))
  };
}

export function parseFlutterEnvelope(raw, expectedTripId) {
  const envelope = typeof raw === 'string' ? JSON.parse(raw) : raw;
  requireCondition(isRecord(envelope), 'Envelope do Flutter inválido.');
  requireCondition(envelope.schemaVersion === TRIP_SCHEMA_VERSION, 'Versão do protocolo não suportada.');
  requireCondition(FROM_FLUTTER_TYPES.has(envelope.type), 'Tipo de mensagem do Flutter inválido.');
  requireCondition(typeof envelope.eventId === 'string' && envelope.eventId.length > 0, 'ID do evento inválido.');
  requireCondition(typeof envelope.tripId === 'string' && envelope.tripId === expectedTripId, 'Corrida da mensagem inválida.');
  requireCondition(isValidDate(envelope.sentAt), 'Data do evento inválida.');
  requireCondition(isRecord(envelope.payload), 'Payload do evento inválido.');

  if (envelope.type === 'vehicle.location' || envelope.type === 'passenger.location') {
    validatePosition(envelope.payload);
  } else if (envelope.type === 'route.replaced') {
    validateCanonicalRoute(envelope.payload);
  } else if (envelope.type === 'trip.bootstrap') {
    requireCondition(envelope.payload.role === 'driver' || envelope.payload.role === 'passenger', 'Papel do bootstrap inválido.');
    requireCondition(typeof envelope.payload.tripStatus === 'string', 'Status da corrida inválido.');
    requireCondition(isRecord(envelope.payload.waiting) && typeof envelope.payload.waiting.active === 'boolean', 'Espera do bootstrap inválida.');
    validateCanonicalRoute(envelope.payload.route);
    if (envelope.payload.vehiclePosition) validatePosition(envelope.payload.vehiclePosition, 'veículo');
    if (envelope.payload.passengerPosition) validatePosition(envelope.payload.passengerPosition, 'passageiro');
  } else if (envelope.type === 'waiting.changed') {
    requireCondition(typeof envelope.payload.active === 'boolean', 'Estado de espera inválido.');
  } else if (envelope.type === 'connection.changed') {
    requireCondition(typeof envelope.payload.connected === 'boolean', 'Estado de conexão inválido.');
  } else if (envelope.type === 'trip.statusChanged') {
    requireCondition(typeof envelope.payload.tripStatus === 'string', 'Status da corrida inválido.');
  } else if (envelope.type === 'command.succeeded' || envelope.type === 'command.failed') {
    requireCondition(typeof envelope.payload.commandEventId === 'string', 'Referência do comando inválida.');
    requireCondition(typeof envelope.payload.commandType === 'string', 'Tipo do comando inválido.');
    if (envelope.type === 'command.failed') requireCondition(typeof envelope.payload.reason === 'string', 'Motivo da falha inválido.');
  }

  return envelope;
}
