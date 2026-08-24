/**
 * Roteamento TomTom com trânsito ao vivo.
 * Adapta a resposta para o formato interno consumido pelo mapa e motor GPS.
 */

import { TOMTOM_CONFIG } from '../config/routeConfig.js';
import { calculateDistance } from '../utils/geoUtils.js';

const routeCache = new Map();

function instructionIcon(instructionType = '') {
  const type = instructionType.toUpperCase();
  if (type.includes('ROUNDABOUT')) return 'roundabout';
  if (type.includes('ARRIVE')) return 'flag';
  if (type.includes('U_TURN') || type.includes('UTURN')) return 'u-turn';
  if (type.includes('RIGHT')) return type.includes('SLIGHT') ? 'arrow-up-right' : 'corner-up-right';
  if (type.includes('LEFT')) return type.includes('SLIGHT') ? 'arrow-up-left' : 'corner-up-left';
  return 'arrow-up';
}

function instructionModifier(instructionType = '') {
  const type = instructionType.toUpperCase();
  if (type.includes('U_TURN') || type.includes('UTURN')) return 'uturn';
  if (type.includes('RIGHT')) return type.includes('SLIGHT') ? 'slight right' : 'right';
  if (type.includes('LEFT')) return type.includes('SLIGHT') ? 'slight left' : 'left';
  return 'straight';
}

function instructionCategory(instructionType = '') {
  const type = instructionType.toUpperCase();
  if (type.includes('ARRIVE')) return 'arrive';
  if (type.includes('DEPART')) return 'depart';
  if (type.includes('ROUNDABOUT')) return 'roundabout';
  if (type.includes('TURN')) return 'turn';
  if (type.includes('KEEP')) return 'fork';
  if (type.includes('EXIT')) return 'off ramp';
  return 'continue';
}

function nearestCoordinateIndex(point, coordinates) {
  if (!point) return 0;
  let closestIndex = 0;
  let smallestDistance = Infinity;

  coordinates.forEach((coordinate, index) => {
    const distance = calculateDistance(
      point.latitude,
      point.longitude,
      coordinate[0],
      coordinate[1]
    );
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

function parseInstructions(route, coordinates) {
  const instructions = route.guidance?.instructions || [];

  return instructions.map((instruction, index) => {
    const next = instructions[index + 1];
    const distanceMeters = next
      ? Math.max(0, next.routeOffsetInMeters - instruction.routeOffsetInMeters)
      : Math.max(0, route.summary.lengthInMeters - instruction.routeOffsetInMeters);
    const durationSeconds = next
      ? Math.max(0, next.travelTimeInSeconds - instruction.travelTimeInSeconds)
      : Math.max(0, route.summary.travelTimeInSeconds - instruction.travelTimeInSeconds);
    const point = instruction.point || {};

    return {
      id: index,
      instruction: instruction.message || (index === instructions.length - 1
        ? 'Você chegará ao seu destino'
        : 'Continue pela rota'),
      rawName: instruction.street || instruction.roadNumbers?.join(' / ') || 'Via principal',
      distanceMeters,
      durationSeconds,
      type: instructionCategory(instruction.instructionType),
      modifier: instructionModifier(instruction.instructionType),
      icon: instructionIcon(instruction.instructionType),
      location: [point.latitude, point.longitude],
      coordIndex: nearestCoordinateIndex(point, coordinates)
    };
  }).filter((step) => step.location.every(Number.isFinite));
}

export async function fetchTomTomRoute(start, end) {
  const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'missing_api_key',
      message: 'A chave da API TomTom não foi configurada.'
    };
  }

  const [startLat, startLng] = start;
  const [endLat, endLng] = end;
  const cacheKey = [startLat, startLng, endLat, endLng].map((value) => value.toFixed(5)).join(':');
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < TOMTOM_CONFIG.trafficCacheTtlMs) {
    return cached.route;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      success: false,
      error: 'offline',
      message: 'Dispositivo sem conexão. O trânsito ao vivo não pôde ser consultado.'
    };
  }

  const locations = `${startLat},${startLng}:${endLat},${endLng}`;
  const url = new URL(`${TOMTOM_CONFIG.baseUrl}/${locations}/json`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('travelMode', 'car');
  url.searchParams.set('routeType', 'fastest');
  url.searchParams.set('traffic', 'true');
  url.searchParams.set('departAt', 'now');
  url.searchParams.set('computeTravelTimeFor', 'all');
  url.searchParams.set('instructionsType', 'text');
  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('routeRepresentation', 'polyline');
  url.searchParams.append('sectionType', 'traffic');

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TOMTOM_CONFIG.timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const details = await response.json().catch(() => null);
      throw new Error(details?.detailedError?.message || `TomTom respondeu com status ${response.status}.`);
    }

    const data = await response.json();
    const route = data.routes?.[0];
    if (!route?.legs?.length) throw new Error('Nenhuma rota foi encontrada pela TomTom.');

    const coordinates = route.legs.flatMap((leg, legIndex) =>
      leg.points
        .slice(legIndex === 0 ? 0 : 1)
        .map((point) => [point.latitude, point.longitude])
    );
    const summary = route.summary;
    const parsedRoute = {
      success: true,
      provider: 'tomtom',
      trafficAware: true,
      distanceMeters: summary.lengthInMeters,
      durationSeconds: summary.travelTimeInSeconds,
      trafficDelaySeconds: summary.trafficDelayInSeconds || 0,
      noTrafficDurationSeconds: summary.noTrafficTravelTimeInSeconds || null,
      historicalTrafficDurationSeconds: summary.historicTrafficTravelTimeInSeconds || null,
      departureTime: summary.departureTime,
      arrivalTime: summary.arrivalTime,
      coordinates,
      steps: parseInstructions(route, coordinates),
      trafficSections: route.sections || [],
      summary: 'Rota mais rápida considerando o trânsito ao vivo',
      waypoints: data.optimizedWaypoints || []
    };

    routeCache.set(cacheKey, { route: parsedRoute, savedAt: Date.now() });
    return parsedRoute;
  } catch (error) {
    console.warn('Falha na requisição TomTom:', error);
    return {
      success: false,
      error: error.name === 'AbortError' ? 'timeout' : 'network_error',
      message: error.name === 'AbortError'
        ? 'A TomTom demorou para responder. Tente novamente.'
        : 'Não foi possível calcular a rota com trânsito. Verifique a conexão e a chave da API.'
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
