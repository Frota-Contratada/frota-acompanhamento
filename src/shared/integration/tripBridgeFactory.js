import { createFlutterTripBridge } from './flutterTripBridge.js';
import { createWebParentTripBridge } from './webParentTripBridge.js';

export function createTripBridge(targetWindow = window, options = {}) {
  if (typeof targetWindow.FlutterTripBridge?.postMessage === 'function') {
    return createFlutterTripBridge(targetWindow);
  }
  if (targetWindow.parent && targetWindow.parent !== targetWindow) {
    return createWebParentTripBridge(targetWindow, options);
  }
  return createFlutterTripBridge(targetWindow);
}
