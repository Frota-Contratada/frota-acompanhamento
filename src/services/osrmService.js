/**
 * Serviço de Roteamento com a API Demo da OSRM
 * Endpoint: https://router.project-osrm.org/route/v1/driving/
 */

import { APP_CONFIG } from '../config.js';
import { calculateDistance } from './geoUtils.js';
import { storageService } from './storageService.js';

// Cache em memória para respostas de rota durante a sessão
const routeCache = new Map();

/**
 * Traduz e gera instruções de manobras amigáveis em Português
 */
function formatManeuverInstruction(step, isLast) {
  if (isLast) {
    return 'Você chegará ao seu destino';
  }

  const { maneuver, name, ref } = step;
  const streetName = name || ref || 'via sem nome';
  const type = maneuver.type;
  const modifier = maneuver.modifier;

  switch (type) {
    case 'depart':
      return `Siga em direção a ${streetName}`;
    case 'arrive':
      return `Destino alcançado em ${streetName}`;
    case 'turn':
      if (modifier === 'left' || modifier === 'sharp left') return `Vire à esquerda na ${streetName}`;
      if (modifier === 'right' || modifier === 'sharp right') return `Vire à direita na ${streetName}`;
      if (modifier === 'slight left') return `Curva suave à esquerda na ${streetName}`;
      if (modifier === 'slight right') return `Curva suave à direita na ${streetName}`;
      if (modifier === 'uturn') return `Faça o retorno na ${streetName}`;
      return `Vire na ${streetName}`;
    case 'new name':
    case 'continue':
    case 'straight':
      return `Continue em frente na ${streetName}`;
    case 'roundabout':
    case 'rotary':
      const exit = maneuver.exit ? `pegue a ${maneuver.exit}ª saída` : 'entre na rotatória';
      return `Na rotatória, ${exit} para ${streetName}`;
    case 'fork':
      return modifier?.includes('left')
        ? `Mantenha-se à esquerda na ${streetName}`
        : `Mantenha-se à direita na ${streetName}`;
    case 'merge':
      return `Acesse ${streetName}`;
    case 'on ramp':
      return `Pegue o acesso para ${streetName}`;
    case 'off ramp':
      return `Pegue a saída para ${streetName}`;
    default:
      return `Siga por ${streetName}`;
  }
}

/**
 * Mapeia o tipo de manobra para um ícone correspondente
 */
function getManeuverIcon(step, isLast) {
  if (isLast) return 'flag';
  const { type, modifier } = step.maneuver;

  if (type === 'roundabout' || type === 'rotary') return 'roundabout';
  if (type === 'arrive') return 'flag';
  if (type === 'depart') return 'arrow-up';
  if (modifier === 'uturn') return 'u-turn';
  if (modifier === 'sharp right' || modifier === 'right') return 'corner-up-right';
  if (modifier === 'sharp left' || modifier === 'left') return 'corner-up-left';
  if (modifier === 'slight right') return 'arrow-up-right';
  if (modifier === 'slight left') return 'arrow-up-left';
  return 'arrow-up';
}

/**
 * Consulta a rota na API demo OSRM ou recupera do cache persistente
 * @param {[number, number]} start [lat, lng]
 * @param {[number, number]} end [lat, lng]
 * @returns {Promise<Object>} Dados processados da rota ou objeto de erro
 */
export async function fetchOSRMRoute(start, end) {
  const [startLat, startLng] = start;
  const [endLat, endLng] = end;

  const cacheKey = `${startLat.toFixed(5)},${startLng.toFixed(5)};${endLat.toFixed(5)},${endLng.toFixed(5)}`;
  
  // 1. Verifica cache em memória
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey);
  }

  // 2. Verifica cache persistente (localStorage)
  const persistedRoute = storageService.getCachedRoute(cacheKey);
  if (persistedRoute && persistedRoute.coordinates && persistedRoute.coordinates.length > 0) {
    routeCache.set(cacheKey, persistedRoute);
    return persistedRoute;
  }

  // 3. Se estiver offline do navegador, não tenta requisição externa
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      success: false,
      error: 'offline',
      message: 'Dispositivo sem conexão com a internet. Não foi possível calcular o trajeto.'
    };
  }

  const url = `${APP_CONFIG.osrm.baseUrl}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.osrm.timeoutMs);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erro na resposta OSRM: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`Nenhuma rota encontrada: ${data.code}`);
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Converte coordenadas GeoJSON [lon, lat] para formato Leaflet [lat, lon]
    const coordinates = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

    // Mapeia cada passo para o índice correspondente na lista de coordenadas
    const steps = (leg.steps || []).map((step, index, arr) => {
      const isLast = index === arr.length - 1;
      const stepLoc = [step.maneuver.location[1], step.maneuver.location[0]]; // [lat, lng]

      // Encontra o índice da coordenada mais próxima deste passo
      let closestIdx = 0;
      let minDst = Infinity;
      for (let c = 0; c < coordinates.length; c++) {
        const d = calculateDistance(stepLoc[0], stepLoc[1], coordinates[c][0], coordinates[c][1]);
        if (d < minDst) {
          minDst = d;
          closestIdx = c;
        }
      }

      return {
        id: index,
        instruction: formatManeuverInstruction(step, isLast),
        rawName: step.name || step.ref || 'Via principal',
        distanceMeters: step.distance,
        durationSeconds: step.duration,
        type: step.maneuver.type,
        modifier: step.maneuver.modifier,
        icon: getManeuverIcon(step, isLast),
        location: stepLoc,
        coordIndex: closestIdx
      };
    });

    // Ordena os passos por índice de coordenada crescente
    steps.sort((a, b) => a.coordIndex - b.coordIndex);

    const parsedRoute = {
      success: true,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      coordinates,
      steps,
      summary: leg.summary || '',
      waypoints: data.waypoints
    };

    // Grava no cache de memória e persistente
    routeCache.set(cacheKey, parsedRoute);
    storageService.setCachedRoute(cacheKey, parsedRoute);

    return parsedRoute;
  } catch (error) {
    console.warn('Falha na requisição OSRM:', error);
    return {
      success: false,
      error: 'network_error',
      message: 'Não foi possível carregar a rota dos servidores. Verifique sua conexão com a internet.'
    };
  }
}
