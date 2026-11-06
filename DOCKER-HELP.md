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

### Publicação no Render

O `Dockerfile` de produção declara as configurações públicas `VITE_*` como
argumentos no estágio de build. O Render passa as variáveis configuradas no
serviço como build args; o Vite incorpora esses valores ao JavaScript gerado.

Configure `VITE_POSTGRES_API_URL` com a origem da API, sem `/delta` no final,
para habilitar o login. As demais integrações usam `VITE_MONGO_API_URL`,
`VITE_RANKING_API_URL`, `VITE_AI_API_URL` e `VITE_WEATHER_API_URL`.
`VITE_TARIFF_REGIONS` permite substituir as regiões tarifárias e é opcional.
Essas variáveis são públicas e não devem conter senhas, tokens ou chaves privadas.

Após alterar os valores, gere um novo build e deploy. Reiniciar o container
ou reutilizar uma imagem já compilada não altera a configuração do frontend.

### CD pelo GitHub Actions

O workflow `.github/workflows/cd.yml` segue o padrão da API de IA: a cada push
na `main`, envia um POST ao deploy hook do Render para iniciar um novo build
e deploy da aplicação web. O CI técnico e o Sonar continuam nos workflows de PR.

Para configurar:

1. No Render, abra o serviço `delta-web-app` e copie seu **Settings > Deploy Hook**.
2. No GitHub deste repositório, abra **Settings > Secrets and variables > Actions**
   e crie o repository secret `RENDER_DEPLOY_HOOK` com essa URL.
3. Para que o GitHub Actions seja o único disparador, defina **Auto-Deploy > Off**
   nas configurações do serviço no Render, evitando dois deploys por push.

Use o hook da aplicação web; o hook da API de IA publica outro serviço.
A URL é secreta e não deve ser incluída em arquivos ou logs. As variáveis
`VITE_*` continuam configuradas no serviço do Render para o build do frontend.

O workflow falha se o secret estiver ausente, houver falha de conexão ou o Render
retornar erro HTTP. Sucesso indica que o Render aceitou o disparo; acompanhe o
resultado do build e do deploy em **Deploys**, no painel do Render.

### Verificações do frontend

Confira a saída do ESLint, TypeScript e Vite e o código de saída do serviço `checks`. Uma falha no lint interrompe a sequência. Este fluxo não abre o aplicativo no navegador e não executa testes funcionais. Não precisa de API, banco, `.env` ou porta publicada.

Para diagnosticar falhas de um serviço Compose, use `docker compose -p <projeto> -f <arquivo> ps -a` e `docker compose -p <projeto> -f <arquivo> logs <serviço>`, com o mesmo projeto e arquivo da execução.

`down` preserva volumes nomeados. Só use `down -v` depois de conferir o nome do projeto e confirmar que seus dados são descartáveis. Não remova volumes de outros ambientes.
