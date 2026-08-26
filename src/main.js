import { bootstrapApp } from './app/bootstrap.js';
import { resolveAppRole } from './shared/domain/appRoles.js';
import { createFlutterTripBridge } from './shared/integration/flutterTripBridge.js';

const tripBridge = createFlutterTripBridge(window);

bootstrapApp(resolveAppRole(), { tripBridge })
  .then(() => tripBridge.start())
  .catch((error) => {
    console.error('Não foi possível iniciar o acompanhamento:', error);
  });
