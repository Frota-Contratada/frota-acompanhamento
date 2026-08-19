// Configurações do aplicativo de acompanhamento de corridas

export const APP_CONFIG = {
  // Rota padrão solicitada pelo usuário
  defaultRoute: {
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
  },

  // Rotas pré-definidas para testes
  presetRoutes: [
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
  ],

  // Limite em metros para considerar que o usuário desviou da rota
  deviationThresholdMeters: 45,

  // Velocidades de simulação base (km/h)
  defaultSpeedKmH: 50,

  // Cores do Tema
  colors: {
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
  },

  // API OSRM
  osrm: {
    baseUrl: 'https://router.project-osrm.org/route/v1/driving',
    timeoutMs: 8000
  }
};
