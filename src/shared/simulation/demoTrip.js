export const DEMO_CANONICAL_ROUTE = Object.freeze({
  routeId: '00000000-0000-4000-8000-000000000001',
  version: 1,
  calculatedAt: '2026-01-01T12:00:00.000Z',
  origin: {
    id: 'demo-origin',
    sequence: 0,
    kind: 'origin',
    label: 'R. Lençóis, 85 - Vila Baruel',
    lat: -23.507248,
    lng: -46.653695
  },
  stops: [{
    id: 'demo-stop',
    sequence: 1,
    kind: 'stop',
    label: 'Av. Otaviano Alves de Lima',
    lat: -23.5058,
    lng: -46.6925
  }],
  destination: {
    id: 'demo-destination',
    sequence: 2,
    kind: 'destination',
    label: 'R. Irineu José Bordon, 335 - Parque Anhanguera',
    lat: -23.513207,
    lng: -46.731058
  },
  coordinates: [
    { lat: -23.507248, lng: -46.653695 },
    { lat: -23.5067, lng: -46.6585 },
    { lat: -23.5059, lng: -46.6642 },
    { lat: -23.5051, lng: -46.6704 },
    { lat: -23.5046, lng: -46.6771 },
    { lat: -23.5051, lng: -46.6846 },
    { lat: -23.5058, lng: -46.6925 },
    { lat: -23.5069, lng: -46.7001 },
    { lat: -23.5082, lng: -46.7073 },
    { lat: -23.5095, lng: -46.7141 },
    { lat: -23.5109, lng: -46.7206 },
    { lat: -23.5121, lng: -46.7261 },
    { lat: -23.513207, lng: -46.731058 }
  ],
  distanceMeters: 8450,
  durationSeconds: 1020,
  trafficDelaySeconds: 180,
  trafficSections: [{
    startIndex: 7,
    endIndex: 10,
    delaySeconds: 180,
    category: 'JAM'
  }],
  instructions: [
    {
      id: 'demo-instruction-1',
      instruction: 'Siga em frente pela Rua Lençóis',
      streetName: 'Rua Lençóis',
      distanceMeters: 2100,
      durationSeconds: 240,
      type: 'continue',
      modifier: 'straight',
      icon: 'arrow-up',
      location: { lat: -23.5059, lng: -46.6642 },
      coordinateIndex: 2
    },
    {
      id: 'demo-instruction-2',
      instruction: 'Mantenha-se à esquerda na Marginal Tietê',
      streetName: 'Marginal Tietê',
      distanceMeters: 3900,
      durationSeconds: 480,
      type: 'fork',
      modifier: 'slight left',
      icon: 'arrow-up-left',
      location: { lat: -23.5058, lng: -46.6925 },
      coordinateIndex: 6
    },
    {
      id: 'demo-instruction-3',
      instruction: 'Pegue a saída em direção ao Parque Anhanguera',
      streetName: 'Av. Raimundo Pereira de Magalhães',
      distanceMeters: 2450,
      durationSeconds: 300,
      type: 'off ramp',
      modifier: 'right',
      icon: 'corner-up-right',
      location: { lat: -23.5109, lng: -46.7206 },
      coordinateIndex: 10
    }
  ]
});

export function createDemoVehiclePosition() {
  return {
    lat: DEMO_CANONICAL_ROUTE.origin.lat,
    lng: DEMO_CANONICAL_ROUTE.origin.lng,
    accuracy: 3,
    speed: 0,
    heading: 270,
    timestamp: new Date().toISOString()
  };
}
