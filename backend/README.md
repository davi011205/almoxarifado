# Backend — API REST do Almoxarifado

Backend Java 21 + Spring Boot + Spring Security (Bearer JWT) + Spring Data JPA + PostgreSQL.

## O que fica persistido no banco

- Funcionários, seus perfis e senhas com hash BCrypt (nunca a senha em texto puro).
- Produtos identificados pelo código lido/digitado, com saldo, estoque mínimo, quantidade ideal, nome, marca e coordenada/prateleira.
- Movimentações de entrada e retirada, funcionário responsável, data/hora e projeto de destino.
- Número de WhatsApp para solicitações de reposição.
- Notas de reposição e seus itens, saldos, mínimos, ideais e quantidades sugeridas.

O banco PostgreSQL é compartilhado por todas as sessões e dispositivos que utilizam esta API.

## Executar localmente com Docker

Na raiz do repositório:

```bash
docker compose up --build
```

A API estará em `http://localhost:8080`; a verificação pública é `GET http://localhost:8080/api/health`.

A interface React está em `frontend/smsgroup`. Em outro terminal:

```bash
cd frontend/smsgroup
npm ci
npm run dev
```

O Vite encaminha chamadas `/api` para `http://localhost:8080`. A configuração padrão local cria o administrador `davi` com senha `1234`; altere isso no ambiente antes de usar fora da máquina local.

### Executar sem Docker

É necessário Java 21, Maven e PostgreSQL. Crie um banco `almoxarifado`, depois configure:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/almoxarifado
export SPRING_DATASOURCE_USERNAME=almoxarifado
export SPRING_DATASOURCE_PASSWORD='sua-senha-do-banco'
export JWT_SECRET='uma-chave-aleatoria-com-pelo-menos-32-caracteres'
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD='uma-senha-forte-com-pelo-menos-6-caracteres'
export CORS_ALLOWED_ORIGINS=http://localhost:5173
mvn spring-boot:run
```

Os valores `davi` / `1234` são somente defaults para desenvolvimento local. O administrador inicial só é criado se ainda não existir usuário com o nome configurado. Defina as variáveis antes da primeira inicialização em qualquer ambiente compartilhado.

## Principais rotas

Todas as rotas, exceto `POST /api/auth/login` e `GET /api/health`, exigem `Authorization: Bearer <token>`.

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | Pública | Autenticar e receber JWT |
| GET | `/api/auth/me` | Autenticado | Validar sessão atual |
| GET | `/api/estoque` | Autenticado | Saldo por código de produto |
| GET | `/api/estoque/produtos?busca=...` | Autenticado | Produtos e metadados, com busca em código/nome/marca/coordenada |
| POST | `/api/estoque/movimentacoes` | Funcionário ou administrador | Confirmar um carrinho inteiro em transação única |
| GET | `/api/movimentacoes` | Administrador | Histórico de movimentações |
| GET/POST | `/api/funcionarios` | Administrador | Listar/cadastrar funcionários |
| PUT/DELETE | `/api/funcionarios/{id}` | Administrador | Editar/desativar funcionário |
| GET | `/api/configuracoes/reposicao` | Autenticado | Ler configurações de reposição |
| PUT | `/api/configuracoes/whatsapp` | Administrador | Salvar telefone WhatsApp |
| PUT | `/api/produtos/{codigo}/parametros` | Administrador | Salvar mínimo e ideal (ideal padrão 50) |
| PUT | `/api/produtos/{codigo}/detalhes` | Administrador | Salvar nome, marca e coordenada/prateleira |
| GET | `/api/notas-reposicao` | Administrador | Consultar notas persistidas |
| POST | `/api/notas-reposicao` | Autenticado; nota manual só para administrador | Criar uma nota completa com todos os itens abaixo do mínimo no banco |

## Exemplo de chamadas

Login:

```http
POST /api/auth/login
Content-Type: application/json

{"usuario":"admin","senha":"sua-senha"}
```

Confirmação de movimentação em lote:

```http
POST /api/estoque/movimentacoes
Authorization: Bearer <token>
Content-Type: application/json

{
  "operacao": "retirar",
  "projetoDestino": "Projeto de exemplo",
  "itens": [
    {"produto":"FITA-ISOLANTE", "quantidade":2},
    {"produto":"PARAFUSO-M8", "quantidade":10}
  ]
}
```

A API valida o saldo do banco e grava todos os itens e respectivos registros de histórico na mesma transação. Se qualquer item for inválido ou uma retirada exceder o saldo atual, nenhuma parte do lote será confirmada.

Criar nota após uma confirmação/revisão do usuário:

```http
POST /api/notas-reposicao
Authorization: Bearer <token>
Content-Type: application/json

{"origem":"manual"}
```

A API não confia na lista de itens enviada pelo navegador: consulta o estoque do banco e salva todos os produtos cujo saldo esteja abaixo do mínimo, com `quantidadeRepor = max(0, quantidadeIdeal - quantidadeAtual)`.

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `SPRING_DATASOURCE_URL` | URL JDBC do PostgreSQL (`jdbc:postgresql://host:5432/banco`) |
| `SPRING_DATASOURCE_USERNAME` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | Senha do banco |
| `JWT_SECRET` | Chave privada aleatória com pelo menos 32 bytes |
| `JWT_EXPIRATION_MS` | Validade do token, default 8 horas |
| `ADMIN_USERNAME` | Usuário de administrador inicial |
| `ADMIN_PASSWORD` | Senha inicial (definir segredo forte) |
| `ADMIN_NAME` | Nome do administrador inicial |
| `CORS_ALLOWED_ORIGINS` | Origens autorizadas separadas por vírgula |
| `WHATSAPP_PADRAO` | Número inicial de WhatsApp com país e DDD |

`spring.jpa.hibernate.ddl-auto=update` permite que o protótipo crie/atualize as tabelas automaticamente. Para produção com exigência de migrações controladas, configure Flyway/Liquibase antes de evoluir o esquema.

## Implantação Render

1. Crie um PostgreSQL gerenciado no Render.
2. Crie um serviço Web usando Docker com `backend/Dockerfile` (contexto de build `backend`).
3. Configure `SPRING_DATASOURCE_URL` como `jdbc:postgresql://<host-interno>:5432/<database>` e as variáveis de usuário/senha com os valores do banco.
4. Defina `JWT_SECRET`, `ADMIN_USERNAME` e `ADMIN_PASSWORD` como segredos de ambiente; nunca publique credenciais reais no Git.
5. Defina `CORS_ALLOWED_ORIGINS` com a URL pública exata do Static Site do frontend, sem barra no final.
6. No Static Site do frontend, defina `VITE_API_URL=https://<nome-da-api>.onrender.com/api` e faça um novo deploy, pois variáveis `VITE_*` são incorporadas no build.

A versão anterior guardava dados em `localStorage`. Esses dados antigos não são migrados automaticamente para o PostgreSQL; a nova fonte de verdade é a API/banco. Os dados criados pela versão integrada ficam compartilhados entre todos os clientes conectados à mesma instância.
