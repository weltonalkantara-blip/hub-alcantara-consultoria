# Hub Alcântara Consultoria Farma 360

Portal de Projetos da Alcântara Consultoria Farma 360: centraliza todos os
projetos da consultoria em um único acesso, com login, permissões, anexos e
relatórios.

## Stack

- [Next.js](https://nextjs.org) (App Router) + Tailwind CSS
- [Firebase](https://firebase.google.com): Authentication (e-mail/senha),
  Firestore (banco de dados) e Storage (anexos)
- Deploy contínuo via [Vercel](https://vercel.com)

## Estrutura

```
app/
  login/            → autenticação (login e cadastro)
  dashboard/        → listagem e cadastro de projetos
  projeto/[id]/     → detalhes do projeto e anexos
components/
  Navbar.js         → topo com usuário logado e logout
lib/
  useAuth.js        → hook de estado de autenticação
firebase.js         → inicialização do Firebase (Auth, Firestore, Storage)
```

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Firebase

O projeto usa o Firebase **Alcantaraconsultfarma360** (id `consultoria-farm`).
Coleções do Firestore:

- `projetos`: `nome`, `categoria`, `status`, `descricao`, `data_inicio`, `data_fim`
  - subcoleção `anexos`: `nome`, `url`, `caminho`, `enviado_por`, `enviado_em`
- `usuarios`: `nome`, `email`, `tipo` (`admin` | `consultor` | `cliente`)

Regras de segurança (`firestore.rules` e `storage.rules`) exigem usuário
autenticado. Ver comentários nos próprios arquivos de regras no console do
Firebase para o plano de evolução para permissões por papel.

## Roadmap

- **Fase 1** (atual): login + cadastro básico de projetos.
- **Fase 2**: upload de documentos e dashboard com filtros avançados.
- **Fase 3**: relatórios automáticos e permissões avançadas por papel.

## Deploy

Repositório conectado ao Vercel para deploy automático a cada push na branch
principal.
