# Organização por perfil

A aplicação é dividida por experiência de uso, sem compartilhar componentes apenas
porque ambos os perfis exibem um mapa.

- `driver/`: aplicação operacional do motorista. Inclui GPS ativo, câmera de navegação,
  seta do veículo, instruções, voz, recálculo, modo de espera e simulador.
- `passenger/`: acompanhamento superior e passivo da corrida, sem instruções de
  condução, modo de espera ou câmera head-up.
- `../shared/`: utilidades sem conhecimento de perfil que podem ser usadas pelos dois lados.

O ponto de entrada escolhe explicitamente um perfil por meio de `app/bootstrap.js`.
O motorista continua sendo o perfil padrão. O passageiro pode ser aberto com
`?role=passenger` ou pelo caminho `/passageiro` quando o servidor usa fallback de SPA.
