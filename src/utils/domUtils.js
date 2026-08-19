import L from 'leaflet';

/**
 * Utilitário de Clique Rápido para Dispositivos Móveis e Desktop.
 * Evita o atraso de 300ms do iOS/Android, cancela a simulação de mouse ghost click
 * e impede que o evento de toque seja propagado para o mapa Leaflet de fundo.
 */
export function addFastClickListener(element, handler) {
  if (!element || typeof handler !== 'function') return;

  // Desativa a propagação do Leaflet se o elemento estiver sobre o mapa
  if (typeof L !== 'undefined' && L.DomEvent) {
    L.DomEvent.disableClickPropagation(element);
    L.DomEvent.disableScrollPropagation(element);
  }

  let lastTouchTime = 0;

  element.addEventListener('touchend', (e) => {
    lastTouchTime = Date.now();
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
    handler(e);
  }, { passive: false });

  element.addEventListener('click', (e) => {
    e.stopPropagation();
    // Se o clique sintético ocorrer logo após o toque (< 500ms), ignora a duplicata
    if (Date.now() - lastTouchTime < 500) {
      e.preventDefault();
      return;
    }
    handler(e);
  });
}

/**
 * Desativa a propagação de eventos do Leaflet para um container ou elemento.
 * Impede que gestos sobre botões ou cards afetem o mapa de fundo.
 */
export function disableLeafletPropagation(element) {
  if (!element) return;
  L.DomEvent.disableClickPropagation(element);
  L.DomEvent.disableScrollPropagation(element);
}
