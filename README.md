# React + TypeScript + Vite

## API e autenticação

Copie `.env.example` para `.env.local` e defina `VITE_POSTGRES_API_URL` com a origem da API, sem `/delta` no final. Reinicie o servidor de desenvolvimento após alterar essa configuração.

O formulário envia e-mail e senha para `POST /delta/auth/login`. Após autenticar, abre `/instalacoes`. Os tokens ficam no `sessionStorage` da aba; a senha não é armazenada. As consultas enviam `Authorization: Bearer ...`, renovam o access token via `POST /delta/auth/refresh` quando necessário e retornam ao login quando a sessão deixa de ser válida. O perfil usa `GET /delta/auth/me` para carregar nome e e-mail.

A lista de instalações identifica o usuário em `/delta/auth/me`, consulta suas associações em `/delta/user-properties/{userId}` e busca os detalhes somente dos imóveis vinculados. Endereços e consumos também são consultados apenas para essas instalações. Uma conta sem associações exibe a lista vazia; falhas na consulta não acionam a listagem geral de imóveis.

`npm test` verifica login, erros, cancelamento, envio do token, renovação simultânea e expiração usando respostas simuladas, sem acessar contas reais. O teste completo no ambiente depende de uma conta ativa no backend. `npm run build` e `npm run lint` verificam compilação e análise estática.

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
