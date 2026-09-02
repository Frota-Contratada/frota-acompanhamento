import { bootstrapApp } from './app/bootstrap.js';
import { resolveAppRole } from './shared/domain/appRoles.js';
import { createTripBridge } from './shared/integration/tripBridgeFactory.js';

const allowedParentOrigins = String(import.meta.env.VITE_PARENT_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const tripBridge = createTripBridge(window, { allowedOrigins: allowedParentOrigins });

bootstrapApp(resolveAppRole(), { tripBridge })
  .then(() => tripBridge.start())
  .catch((error) => {
    console.error('Não foi possível iniciar o acompanhamento:', error);
  });
