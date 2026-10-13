# Docker — delta-web-app

## Objetivo

Executar os scripts existentes de lint e build do frontend em container.

## Pré-requisitos

Docker Engine em execução e Docker Compose v2. Execute os comandos na raiz deste repositório. Os exemplos usam uma identificação de projeto própria para isolar containers e volumes.

## Executar

```bash
docker compose -p delta-web-app-test -f docker-compose.test.yml config --quiet
docker compose -p delta-web-app-test -f docker-compose.test.yml run --build --rm checks
docker compose -p delta-web-app-test -f docker-compose.test.yml down
```

## Conferir o resultado e encerrar

Confira a saída do ESLint, TypeScript e Vite e o código de saída do serviço `checks`. Uma falha no lint interrompe a sequência. Este fluxo não abre o aplicativo no navegador e não executa testes funcionais. Não precisa de API, banco, `.env` ou porta publicada.

Para diagnosticar falhas de um serviço Compose, use `docker compose -p <projeto> -f <arquivo> ps -a` e `docker compose -p <projeto> -f <arquivo> logs <serviço>`, com o mesmo projeto e arquivo da execução.

`down` preserva volumes nomeados. Só use `down -v` depois de conferir o nome do projeto e confirmar que seus dados são descartáveis. Não remova volumes de outros ambientes.
