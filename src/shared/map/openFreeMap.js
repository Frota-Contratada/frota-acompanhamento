import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

maplibregl.setWorkerUrl(mapLibreWorkerUrl);

export const OPEN_FREE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export function toLngLat(position) {
  return [Number(position[1]), Number(position[0])];
}

export function toLatLng(position) {
  return [Number(position.lat), Number(position.lng)];
}

export function lineFeature(coordinates, properties = {}) {
  return {
    type: 'Feature',
    properties,
    geometry: {
      type: 'LineString',
      coordinates: (coordinates || []).map(toLngLat)
    }
  };
}

export function emptyLineFeature() {
  return {
    type: 'Feature',
    properties: {},
    geometry: null
  };
}

export function featureCollection(features = []) {
  return { type: 'FeatureCollection', features };
}

export function boundsFromCoordinates(coordinates) {
  if (!coordinates?.length) return null;
  const bounds = new maplibregl.LngLatBounds();
  coordinates.forEach((coordinate) => bounds.extend(toLngLat(coordinate)));
  return bounds;
}

export function createHtmlElement(className, html) {
  const element = document.createElement('div');
  element.className = className;
  element.innerHTML = html;
  return element;
}

export function setSourceData(map, sourceId, data) {
  const source = map?.getSource(sourceId);
  if (source?.setData) source.setData(data);
}

export { maplibregl };
