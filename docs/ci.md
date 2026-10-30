# CI técnico

Em pull requests e por execução manual, o GitHub Actions instala as dependências com `npm ci` no Node 22 e executa:

```sh
npm ci
npm test
npm run lint
npm run build
```

Os testes usam respostas simuladas; não validam integração com o backend, contas reais ou a interface em um navegador. O lint verifica regras estáticas e o build compila TypeScript e gera a aplicação com Vite. Os mesmos comandos podem ser executados localmente com Node 22.
