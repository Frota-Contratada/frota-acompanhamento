# frota-acompanhamento

Acompanhamento ao vivo das corridas, com experiências separadas para motorista
e passageiro.

## Execução

```bash
npm install
npm run dev
```

- Motorista: `http://localhost:3000/?role=driver`
- Passageiro: `http://localhost:3000/?role=passenger`
- Testes: `npm test`
- Build: `npm run build`

No navegador comum, o projeto usa uma rota fixa e mantém somente os controles
do simulador. Dentro da WebView Flutter, o contexto nativo é detectado
automaticamente e o mobile passa a ser a fonte da corrida, da rota canônica e
das posições. O webapp não calcula rotas nem solicita geolocalização do
navegador. Consulte [docs/flutter-integration.md](docs/flutter-integration.md).
