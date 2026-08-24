import { APP_ROLES } from '../shared/domain/appRoles.js';

const APP_MOUNTERS = Object.freeze({
  [APP_ROLES.DRIVER]: async () => {
    const { mountDriverApp } = await import('../features/driver/driverApp.js');
    mountDriverApp();
  },
  [APP_ROLES.PASSENGER]: async () => {
    const { mountPassengerApp } = await import('../features/passenger/passengerApp.js');
    mountPassengerApp();
  }
});

/**
 * Inicializa somente a experiência solicitada pelo ponto de entrada.
 * O carregamento por perfil impede que recursos de navegação do motorista
 * sejam acoplados à futura visualização do passageiro.
 */
export async function bootstrapApp(role) {
  const mountApp = APP_MOUNTERS[role];

  if (!mountApp) {
    throw new Error(`O perfil "${role}" ainda não possui uma aplicação implementada.`);
  }

  await mountApp();
}
