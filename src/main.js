import { bootstrapApp } from './app/bootstrap.js';
import { resolveAppRole } from './shared/domain/appRoles.js';

bootstrapApp(resolveAppRole());
