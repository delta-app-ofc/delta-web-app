# React + TypeScript + Vite

## API e autenticação

Copie `.env.example` para `.env.local` e defina `VITE_POSTGRES_API_URL` com a origem da API, sem `/delta` no final. Reinicie o servidor de desenvolvimento após alterar essa configuração.

O formulário envia e-mail e senha para `POST /delta/auth/login`. Após autenticar, abre `/instalacoes`. Os tokens ficam no `sessionStorage` da aba; a senha não é armazenada. As consultas enviam `Authorization: Bearer ...`, renovam o access token via `POST /delta/auth/refresh` quando necessário e retornam ao login quando a sessão deixa de ser válida. O perfil usa `GET /delta/auth/me` para carregar nome e e-mail.

A lista de instalações identifica o usuário em `/delta/auth/me`, consulta suas associações em `/delta/user-properties/{userId}` e busca os detalhes somente dos imóveis vinculados. Endereços e consumos também são consultados apenas para essas instalações. Uma conta sem associações exibe a lista vazia; falhas na consulta não acionam a listagem geral de imóveis.

`npm test` verifica login, erros, cancelamento, envio do token, renovação simultânea e expiração usando respostas simuladas, sem acessar contas reais. O teste completo no ambiente depende de uma conta ativa no backend. `npm run build` e `npm run lint` verificam compilação e análise estática.

## Cadastro de instalação

A rota protegida `/instalacoes/cadastrar` abre o formulário baseado nas telas “Cadastrar instalação” e “Cadastrar instalação erro” do Figma. O botão da listagem abre essa rota; Voltar e Cancelar retornam às instalações. Os campos têm validação, máscara de CEP, mensagens associadas e foco no primeiro erro.

O cadastro envia `POST /delta/address`, `POST /delta/property` com o usuário autenticado e, após confirmar a associação criada, `POST /delta/device`. Classificação e região tarifárias são escolhas explícitas. Os códigos confirmados para o projeto são: 1 Grande São Paulo, 2 Lins, 3 Presidente Prudente, 4 Adamantina/Pirapozinho e 5 Bragança Paulista. `VITE_TARIFF_REGIONS` permite substituí-los com um JSON de itens `{ "id": 1, "name": "Grande São Paulo" }`. A tarifa da região é consultada antes de criar o endereço; nenhum ID é deduzido do CEP.

O consumo é somente leitura, alimentado pelas análises do hidrômetro. A meta está desabilitada porque a API atual não oferece persistência desse dado. O ID informado cadastra um dispositivo novo, mantendo sua identidade exata; não consulta a rota interna nem lista dispositivos globais. Uma identidade já cadastrada retorna erro no campo. Após confirmar todas as etapas, o fluxo abre os detalhes da instalação e exibe a confirmação de sucesso.

As gravações da API são separadas e não constituem uma transação única. O formulário preserva os IDs das etapas concluídas durante a mesma abertura: uma falha no dispositivo permite corrigir o campo e continuar sem duplicar imóvel/endereço. Falhas com resultado desconhecido não repetem o mesmo POST automaticamente. A mensagem permite conferir a instalação salva; após sair ou recarregar a página, confira a listagem antes de iniciar outro cadastro. Endereços intermediários podem permanecer se o fluxo for interrompido antes da criação/atualização do imóvel.

## Detalhe da instalação

O link “Ver tudo” abre `/instalacoes/:installationId`, com proteção de sessão. A página confirma a associação ao usuário antes de consultar a propriedade, seu endereço e as análises mensais e diárias. IDs inválidos e instalações sem associação não disparam consultas de consumo.

Consumo mensal, evolução em m³ e histórico diário usam os dados retornados pela API. O custo do mês soma apenas as leituras diárias disponíveis do mês atual e fica indisponível se faltar custo em alguma delas. Falhas parciais mostram aviso e permitem tentar novamente; falta de leitura não é tratada como consumo zero. Vazão, metas, alertas e clima têm estados de indisponibilidade até existir integração. As abas funcionam por clique e pelas teclas de setas, Home e End.

## Edição da instalação

“Editar instalação” abre a rota protegida `/instalacoes/:installationId/editar`. O carregamento confirma a associação ao usuário antes de buscar dados do imóvel, endereço e consumo. Nome, tipo, CEP, cidade, UF e consumo do mês são preenchidos quando disponíveis. O consumo é convertido de litros para m³; falta de leitura permanece em branco. Voltar e Cancelar retornam aos detalhes da mesma instalação.

O formulário compartilhado recebe `mode="edit"`, `initialData`, `apiConnected` e `onSave`. O envio confirma novamente o vínculo com o usuário e compara os dados carregados com a versão atual para evitar sobrescrever alterações concorrentes. A atualização usa `PUT /delta/property/{id}`, preservando organização e área construída. Alterações de endereço criam outro registro antes de atualizar o vínculo, para não modificar um endereço compartilhado por outros imóveis.

O campo opcional de dispositivo cadastra outro dispositivo para a instalação via `POST /delta/device`, preservando os existentes. Deixá-lo em branco mantém os vínculos atuais. O contrato consultado em 23/10/2026 não oferece busca por identidade canônica ou por instalação; por isso a edição não troca, move nem remove dispositivos existentes. A identidade canônica é imutável e o ID inteiro de `/delta/device/{id}` não é deduzido dela. `RegistrationSubmitError` diferencia erro de campo e conclusão parcial, preservando os dados para correção.

## Exportação PDF

Os botões da listagem e dos detalhes geram downloads locais com jsPDF e AutoTable, carregados sob demanda. A listagem exporta somente as linhas filtradas, na ordem exibida, e registra período, busca e ordenação. O detalhe contém identificação, resumo mensal e os históricos completos disponíveis. Valores ausentes continuam identificados como indisponíveis, e os avisos de falha parcial são incluídos.

Os relatórios têm quebra de linhas, paginação, cabeçalhos e horário de São Paulo. A geração não consulta endpoints adicionais e não envia os dados para outro serviço. Os testes usam respostas simuladas para gravação e documentos com múltiplas páginas; nenhuma conta real é modificada por eles.

## Fonte Clayful

A fonte **Clayful**, criada por **Namara Creative**, foi incluída localmente no formato `.otf` para compor o texto de destaque “gota por gota”. Ela foi obtida na [página da Clayful no DaFont](https://www.dafont.com/pt/clayful.font).

A licença que acompanha o arquivo permite **somente uso pessoal** e proíbe uso comercial. Para utilizar a fonte em qualquer atividade comercial, é necessário adquirir previamente a licença adequada na [página oficial de licenciamento da Clayful](https://onedsgn.com/product/clayful-typeface/).

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
   parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
   },
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
