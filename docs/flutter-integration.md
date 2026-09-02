# Integração Flutter ou portal web ↔ acompanhamento

O webapp possui dois modos automáticos:

- **Flutter:** detectado pela presença de `FlutterTripBridge.postMessage`. A
  rota e as posições são recebidas do mobile.
- **Portal web:** detectado quando a página está dentro de um `iframe`. A
  comunicação usa `window.postMessage` e aceita somente origens configuradas.
- **Standalone:** usa uma rota fixa local e mantém somente o simulador para
  desenvolvimento direto no navegador.

Nenhum modo consulta geolocalização do navegador, serviço de geocoding, TomTom,
storage de destino ou backend diretamente. Também não existe tela de criação de
rota no webapp.

O Flutter abre somente `?role=driver` ou `?role=passenger`, injeta
`window.FrotaNativeContext` com `{ schemaVersion, tripId }` e dispara
`flutter.context`. Depois que o web envia `web.ready`, o Flutter entrega
envelopes pelo evento `flutter.trip` e pelo callback compatível
`window.FrotaTripBridge.onMessage`. O web deduplica os dois pelo `eventId`.

## Incorporação em um portal web

Configure no build do acompanhamento as origens que poderão incorporá-lo:

```env
VITE_PARENT_ORIGINS=https://portal.exemplo.com.br,http://localhost:5173
```

O portal abre `?role=driver` ou `?role=passenger` em um `iframe`. Após o evento
`load`, envia o contexto usando a origem exata do acompanhamento:

```js
iframe.contentWindow.postMessage({
  schemaVersion: 1,
  type: 'trip.context',
  tripId: '123'
}, 'https://acompanhamento.exemplo.com.br');
```

O portal deve escutar mensagens, validar `event.origin` e aguardar `web.ready`.
Em seguida, envia `trip.bootstrap` e os demais envelopes pelo mesmo
`postMessage`. A página incorporada responde com os mesmos comandos já usados
no Flutter, como `waiting.confirmed`, `route.rerouteRequested` e
`trip.finishRequested`.

## Comportamento por papel

### Motorista

- `trip.bootstrap` monta a rota, instruções, trânsito, paradas, espera e posição.
- `vehicle.location` alimenta o motor de navegação usando velocidade em m/s,
  precisão, heading e timestamp nativos.
- Um desvio confirmado envia `route.rerouteRequested`; a linha só é substituída
  ao chegar uma `route.replaced` com versão maior.
- Espera e retomada enviam `waiting.confirmed` e
  `waiting.resumeRequested`. A interface muda quando chega
  `waiting.changed`, mantendo o backend como fonte autoritativa.
- Ao chegar ao destino, a confirmação envia `trip.finishRequested` e a tela de
  conclusão só é exibida após `trip.statusChanged` informar o encerramento.

### Passageiro

- Renderiza a mesma rota canônica e sempre mantém a vista superior.
- Somente `vehicle.location` movimenta o veículo.
- `passenger.location` é ignorada pelo mapa; o alerta de afastamento é tratado
  pelo Flutter.
- Nunca solicita recálculo. Uma mudança de trajeto do motorista chega como
  `route.replaced` e é aplicada apenas quando a versão é maior.

## Regras de consistência

- Mensagens de outra corrida, schema incompatível ou payload inválido são
  rejeitadas.
- Posições do veículo mais antigas ou repetidas são descartadas pelo timestamp.
- Rotas repetidas ou antigas são descartadas por `route.version`.
- `connection.changed` informa perda de conexão sem apagar a última rota ou
  posição conhecida.
- O `tripId` nunca é lido da URL, e credenciais não são recebidas pelo webapp.
