# Sidebar Delta

`AppSidebar` reúne marca, navegação e perfil. Não depende de login, services ou da página de instalações: os dados do perfil e os links são recebidos por propriedades.

## Uso

O componente precisa estar dentro de um router do `react-router-dom`. Se a aplicação já tem `BrowserRouter`, use o existente. O contêiner define a largura e a altura disponíveis; em telas baixas, a navegação rola e o perfil permanece no rodapé.

```tsx
import { BrowserRouter } from "react-router-dom";
import { AppSidebar } from "./components/AppSidebar";

export function Example() {
  return (
    <BrowserRouter>
      <div style={{ width: 286, height: "100dvh", padding: 16 }}>
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Nome do usuário", email: "usuario@example.com" }}
        />
      </div>
    </BrowserRouter>
  );
}
```

## Menu personalizado

Sem `navigationItems`, aparece o menu padrão Delta, com Instalações apontando para `/instalacoes` e as outras seções desabilitadas. Para habilitar as telas da sua feature, passe os itens com suas rotas:

```tsx
import dashboardIcon from "./assets/installations/dashboard.svg";
import { AppSidebar } from "./components/AppSidebar";
import type { SidebarNavigationItem } from "./components/AppSidebar";

const items: SidebarNavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: dashboardIcon, path: "/dashboard" },
];

// Dentro do router e de um contêiner com largura/altura definidas:
<AppSidebar label="Navegação principal" navigationItems={items} />;
```

Cada item recebe `id`, `label`, `icon` (URL de imagem) e `path` opcional. Itens sem rota aparecem desabilitados. A rota ativa é destacada pelo `NavLink`.

`profile` é opcional e aceita `name`, `email` e `avatarUrl` opcional. Sem foto, aparece um ícone de usuário; sem perfil, aparecem textos de preenchimento. A sidebar não consulta a API nem oferece ações de autenticação.

Os componentes `SidebarBrand`, `SidebarNavigation` e os 14 SVGs importados em `src/assets/installations/` acompanham a sidebar. React, React Router e CSS Modules já fazem parte do projeto. A borda usa `--installation-border` quando definida pelo layout e tem uma cor padrão própria.
