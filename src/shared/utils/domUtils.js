/**
 * Utilitário de Clique Rápido para Dispositivos Móveis e Desktop.
 * Evita o atraso de 300ms do iOS/Android, cancela a simulação de mouse ghost click
 * e impede que o evento seja propagado para o mapa de fundo.
 */
export function addFastClickListener(element, handler) {
  if (!element || typeof handler !== 'function') return;
  disableMapPropagation(element);

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
 * Desativa a propagação de eventos do mapa para um container ou elemento.
 * Impede que gestos sobre botões ou cards afetem o mapa de fundo.
 */
export function disableMapPropagation(element) {
  if (!element) return;
  [
    'click',
    'dblclick',
    'mousedown',
    'mouseup',
    'pointerdown',
    'pointerup',
    'touchstart',
    'touchmove',
    'touchend',
    'wheel',
    'contextmenu'
  ].forEach((eventName) => {
    element.addEventListener(eventName, (event) => event.stopPropagation(), {
      passive: eventName === 'touchmove' || eventName === 'wheel'
    });
  });
}
