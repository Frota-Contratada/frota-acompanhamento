export const DEFAULT_ROUTE = Object.freeze({
  name: 'Vila Baruel ➔ Parque Anhanguera (SP)',
  origin: {
    lat: -23.507248,
    lng: -46.653695,
    name: 'R. Lençóis, 85 - Vila Baruel, São Paulo - SP, 02523-030',
    shortName: 'R. Lençóis, 85'
  },
  destination: {
    lat: -23.513207,
    lng: -46.731058,
    name: 'R. Irineu José Bordon, 335 - Parque Anhanguera, São Paulo - SP, 05120-060',
    shortName: 'R. Irineu José Bordon, 335'
  }
});

export const PRESET_ROUTES = Object.freeze([
  {
    id: 'sp-lencois-bordon',
    name: 'R. Lençóis ➔ R. Irineu José Bordon (SP)',
    origin: {
      lat: -23.507248,
      lng: -46.653695,
      name: 'R. Lençóis, 85 - Vila Baruel, São Paulo - SP, 02523-030'
    },
    destination: {
      lat: -23.513207,
      lng: -46.731058,
      name: 'R. Irineu José Bordon, 335 - Parque Anhanguera, São Paulo - SP, 05120-060'
    }
  },
  {
    id: 'jaguapita-londrina',
    name: 'Rod PR-340 (Jaguapitã) ➔ Aeroporto de Londrina',
    origin: {
      lat: -23.1091,
      lng: -51.5332,
      name: 'Rod PR-340 - km 2.5, Jaguapitã'
    },
    destination: {
      lat: -23.3328,
      lng: -51.1378,
      name: 'Aeroporto de Londrina'
    }
  },
  {
    id: 'londrina-centro-aeroporto',
    name: 'Centro de Londrina ➔ Aeroporto de Londrina',
    origin: {
      lat: -23.3105,
      lng: -51.1628,
      name: 'Av. Higienópolis, 100 - Centro, Londrina'
    },
    destination: {
      lat: -23.3328,
      lng: -51.1378,
      name: 'Aeroporto de Londrina'
    }
  }
]);

export const THEME_COLORS = Object.freeze({
  primaryNavy: '#1E224F',
  primaryNavyDark: '#141838',
  secondaryNavy: '#282F6B',
  actionRed: '#E50914',
  accentBlue: '#0084FF',
  accentCyan: '#00C2FF',
  warningYellow: '#FFB800',
  successGreen: '#10B981',
  surfaceWhite: '#FFFFFF',
  bgGray: '#F4F6FB',
  textDark: '#1E224F',
  textMuted: '#6B7280'
});

export const TOMTOM_CONFIG = Object.freeze({
  baseUrl: 'https://api.tomtom.com/routing/1/calculateRoute',
  timeoutMs: 12000,
  trafficCacheTtlMs: 120000
});
