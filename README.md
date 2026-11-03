# Delta · Aplicação Web

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-4-646CFF?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-6-CA4245?logo=reactrouter&logoColor=white)
![jsPDF](https://img.shields.io/badge/jsPDF-4-F40F02?logo=adobeacrobatreader&logoColor=white)

Interface web do Delta para autenticação, cadastro e gestão de instalações residenciais. O usuário consulta o consumo recebido pela API e exporta relatórios em PDF.

**Tags:** `react` · `typescript` · `vite` · `react-router` · `autenticação` · `api` · `consumo-de-água` · `pdf`

## Visão geral

| Área | Descrição |
|---|---|
| Responsabilidade | Interface web de autenticação, instalações residenciais e leitura do consumo retornado pela API |
| Tecnologias | React 18, TypeScript 5, Vite 4, React Router 6 e jsPDF |
| Integração | API Delta configurada por `VITE_POSTGRES_API_URL`; regiões tarifárias podem ser substituídas por `VITE_TARIFF_REGIONS` |
| Sessão | Tokens restritos à aba pelo `sessionStorage`; as consultas autenticadas usam Bearer |
| Relatórios | PDFs gerados localmente com jsPDF e AutoTable, sem envio a serviço externo |

## Sumário

- [Início rápido](#início-rápido)
- [API e autenticação](#api-e-autenticação)
- [Cadastro de instalação](#cadastro-de-instalação)
- [Detalhe da instalação](#detalhe-da-instalação)
- [Edição da instalação](#edição-da-instalação)
- [Exportação PDF](#exportação-pdf)
- [Arquitetura, qualidade e acessibilidade](#arquitetura-qualidade-e-acessibilidade)
- [Fonte Clayful](#fonte-clayful)

## Início rápido

Requer Node.js e npm. Na raiz do repositório:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Preencha `VITE_POSTGRES_API_URL` em `.env.local` com a origem da API, sem o sufixo `/delta`. No PowerShell, use `Copy-Item .env.example .env.local` para copiar a configuração de exemplo. O servidor informa o endereço local após iniciar.


## API e autenticação

Copie `.env.example` para `.env.local` e defina `VITE_POSTGRES_API_URL` com a origem da API, sem `/delta` no final. Reinicie o servidor de desenvolvimento após alterar essa configuração.

A rota `/` mantém o cadastro de usuário e empresa; `/login` abre a autenticação. As páginas internas exigem sessão, e acessos sem sessão retornam a `/login`. Após o cadastro visual da empresa, ainda é necessário entrar com uma conta existente na API.

O formulário de login valida os dados e envia e-mail e senha para `POST /delta/auth/login`. Após autenticar, abre `/dashboard`. Os tokens ficam no `sessionStorage` da aba; a senha não é armazenada. As consultas enviam `Authorization: Bearer ...`, renovam o access token via `POST /delta/auth/refresh` quando necessário e retornam ao login quando a sessão deixa de ser válida. O perfil usa `GET /delta/auth/me` para carregar nome e e-mail.

A lista de instalações identifica o usuário em `/delta/auth/me`, consulta suas associações em `/delta/user-properties/{userId}` e busca os detalhes somente dos imóveis vinculados. Endereços e consumos também são consultados apenas para essas instalações. Uma conta sem associações exibe a lista vazia; falhas na consulta não acionam a listagem geral de imóveis.

`npm test` verifica login, erros, cancelamento, envio do token, renovação simultânea e expiração usando respostas simuladas, sem acessar contas reais. O teste completo no ambiente depende de uma conta ativa no backend. `npm run build` e `npm run lint` verificam compilação e análise estática.

## Cadastro de instalação

A rota protegida `/instalacoes/cadastrar` abre o formulário baseado nas telas “Cadastrar instalação” e “Cadastrar instalação erro” do Figma. O botão da listagem abre essa rota; Voltar e Cancelar retornam às instalações. Os campos têm validação, máscara de CEP, mensagens associadas e foco no primeiro erro.

O cadastro envia `POST /delta/address`, `POST /delta/property` com o usuário autenticado e, após confirmar a associação criada, `POST /delta/device`. Classificação e região tarifárias são escolhas explícitas. Os códigos confirmados para o projeto são: 1 Grande São Paulo, 2 Lins, 3 Presidente Prudente, 4 Adamantina/Pirapozinho e 5 Bragança Paulista. `VITE_TARIFF_REGIONS` permite substituí-los com um JSON de itens `{ "id": 1, "name": "Grande São Paulo" }`. A tarifa da região é consultada antes de criar o endereço; nenhum ID é deduzido do CEP.

O consumo é somente leitura, alimentado pelas análises do hidrômetro. A meta está desabilitada porque a API atual não oferece persistência desse dado. O ID informado cadastra um dispositivo novo, mantendo sua identidade exata; não consulta a rota interna nem lista dispositivos globais. Uma identidade já cadastrada retorna erro no campo. Após confirmar todas as etapas, o fluxo abre os detalhes da instalação e exibe a confirmação de sucesso.

O formulário grava endereço, imóvel e dispositivo em etapas e mantém na sessão os IDs já concluídos. Uma falha na etapa do dispositivo permite corrigir o campo e retomar o cadastro sem repetir as etapas anteriores. Se a resposta da API não confirmar o resultado, confira a lista de instalações antes de enviar outro cadastro.

## Detalhe da instalação

O link “Ver tudo” abre `/instalacoes/:installationId`, com proteção de sessão. A página confirma a associação ao usuário antes de consultar a propriedade, seu endereço e as análises mensais e diárias. IDs inválidos e instalações sem associação não disparam consultas de consumo.

Consumo mensal, evolução em m³ e histórico diário usam os dados retornados pela API. O custo do mês soma as leituras diárias do mês atual que incluem custo; em caso de falha parcial, a tela mostra um aviso e permite tentar novamente. As abas funcionam por clique e pelas teclas de setas, Home e End.

## Edição da instalação

“Editar instalação” abre a rota protegida `/instalacoes/:installationId/editar`. O carregamento confirma a associação ao usuário antes de buscar dados do imóvel, endereço e consumo. Nome, tipo, CEP, cidade, UF e consumo do mês são preenchidos quando disponíveis. O consumo é convertido de litros para m³; falta de leitura permanece em branco. Voltar e Cancelar retornam aos detalhes da mesma instalação.

O formulário compartilhado recebe `mode="edit"`, `initialData`, `apiConnected` e `onSave`. O envio confirma novamente o vínculo com o usuário e compara os dados carregados com a versão atual para evitar sobrescrever alterações concorrentes. A atualização usa `PUT /delta/property/{id}`, preservando organização e área construída. Alterações de endereço criam outro registro antes de atualizar o vínculo, para não modificar um endereço compartilhado por outros imóveis.

O campo opcional de dispositivo cadastra outro dispositivo para a instalação via `POST /delta/device`, preservando os existentes. Deixá-lo em branco mantém os vínculos atuais. O contrato consultado em 23/10/2026 não oferece busca por identidade canônica ou por instalação; por isso a edição não troca, move nem remove dispositivos existentes. A identidade canônica é imutável e o ID inteiro de `/delta/device/{id}` não é deduzido dela. `RegistrationSubmitError` diferencia erro de campo e conclusão parcial, preservando os dados para correção.

## Exportação PDF

Os botões da listagem e dos detalhes geram downloads locais com jsPDF e AutoTable, carregados sob demanda. A listagem exporta somente as linhas filtradas, na ordem exibida, e registra período, busca e ordenação. O detalhe contém identificação, resumo mensal e os históricos completos disponíveis. Valores ausentes continuam identificados como indisponíveis, e os avisos de falha parcial são incluídos.

Os relatórios têm quebra de linhas, paginação, cabeçalhos e horário de São Paulo. A geração não consulta endpoints adicionais e não envia os dados para outro serviço. Os testes usam respostas simuladas para gravação e documentos com múltiplas páginas; nenhuma conta real é modificada por eles.

Consulte [DOCKER-HELP.md](DOCKER-HELP.md) para usar o ambiente Docker local.

## Arquitetura, qualidade e acessibilidade

- A autenticação protegida é centralizada em `AuthProvider` e consumida pelo hook tipado `useAuth`; páginas não leem a sessão diretamente.
- Rotas de páginas são carregadas com `React.lazy` e `Suspense`. Serviços externos ficam em `src/services`, com contratos tipados, tratamento centralizado de falhas e cancelamento por `AbortController` nos hooks de consulta.
- Formulários validam e limitam os dados antes de acionar serviços. Mensagens de erro são anunciadas com `role="alert"`, e operações assíncronas apresentam estados de carregamento, sucesso ou erro.
- A navegação oferece atalho para o conteúdo principal, foco visível, controles operáveis por teclado, nomes acessíveis, tabelas identificadas e gerenciamento de foco em diálogos, menus e abas conforme o escopo mínimo da WCAG 2.1 AA.
- O cadastro de empresa salvo no navegador inclui `_versao`, valida e migra versões conhecidas e descarta dados incompatíveis.

## Fonte Clayful

A fonte **Clayful**, criada por **Namara Creative**, foi incluída localmente no formato `.otf` para compor o texto de destaque “gota por gota”. Ela foi obtida na [página da Clayful no DaFont](https://www.dafont.com/pt/clayful.font).

A licença que acompanha o arquivo permite **somente uso pessoal** e proíbe uso comercial. Para utilizar a fonte em qualquer atividade comercial, é necessário adquirir previamente a licença adequada na [página oficial de licenciamento da Clayful](https://onedsgn.com/product/clayful-typeface/).


## Publicação
[https://delta-web-app.onrender.com](https://delta-web-app.onrender.com)
