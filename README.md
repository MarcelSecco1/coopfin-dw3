# CoopFin — módulo financeiro

Aplicação acadêmica de contas financeiras e lançamentos, com front-end React, API REST Express, PostgreSQL, JWT e serviços containerizados. A interface nunca acessa o banco diretamente: todos os dados passam pela API.

## Subir com Docker

```bash
cp .env.example .env
docker compose up --build
```

- Interface: http://localhost:5173
- API: http://localhost:4000/api
- Health check: http://localhost:4000/api/health
- Acesso inicial: `admin` / `admin123` (altere em `.env` antes de usar fora do ambiente local)

Para interromper: `docker compose down`. Para remover também os dados locais do banco: `docker compose down -v`.

Para acompanhar os logs dos serviços:

```bash
docker compose logs -f
```

Use `Ctrl+C` para sair da visualização dos logs.

## Rodar sem Docker

1. Inicie um PostgreSQL e aplique `back-end/src/database/schema.sql`.
2. Em `back-end/`, copie `.env.example` para `.env` (ou exporte as variáveis equivalentes) e rode `npm install && npm run dev`.
3. Em `front-end/`, rode `npm install && npm run dev` com `VITE_API_URL=http://localhost:4000/api`.

## Requisitos implementados

- Login com JWT; rotas de dados exigem `Authorization: Bearer <token>`.
- CRUD de contas e lançamentos, com busca por ID e exclusão lógica (`removido = true`).
- Relação 1:N: cada lançamento pertence a uma conta financeira.
- Dados persistidos em PostgreSQL, incluindo campos texto, `NUMERIC` decimal e `DATE`.
- Servidores de front-end e back-end em portas distintas e cada um em sua própria pasta; banco em serviço container separado.

## APIs

Base URL: `/api`. `POST /auth/login` é público. Endpoints restantes exigem JWT.

| Recurso | Listar | Buscar por ID | Inserir | Atualizar | Excluir |
|---|---|---|---|---|---|
| Contas | `GET /contas` | `GET /contas/:id` | `POST /contas` | `PUT /contas/:id` | `DELETE /contas/:id` |
| Lançamentos | `GET /lancamentos` | `GET /lancamentos/:id` | `POST /lancamentos` | `PUT /lancamentos/:id` | `DELETE /lancamentos/:id` |

Na atualização e inserção, contas recebem `nome`, `tipo`, `instituicao` e `saldoInicial`; lançamentos recebem `descricao`, `valor`, `natureza` (`entrada` ou `saida`), `data`, `contaId` e `status`.
