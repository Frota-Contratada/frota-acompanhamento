export const APP_ROLES = Object.freeze({
  DRIVER: 'driver',
  PASSENGER: 'passenger'
});

export function resolveAppRole(location = window.location) {
  const params = new URLSearchParams(location.search);
  const requestedRole = String(params.get('role') || params.get('perfil') || '').toLowerCase();
  const path = location.pathname.toLowerCase();

  if (
    requestedRole === APP_ROLES.PASSENGER ||
    requestedRole === 'passageiro' ||
    path.includes('/passenger') ||
    path.includes('/passageiro')
  ) {
    return APP_ROLES.PASSENGER;
  }

  return APP_ROLES.DRIVER;
}
