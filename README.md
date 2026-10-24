# Sistema de Almoxarifado

Sistema web de gerenciamento de estoque desenvolvido com React, TypeScript, Java, Spring Boot e PostgreSQL.

## Tecnologias utilizadas

- **Frontend:** React, TypeScript e Vite.
- **Backend:** Java 21, Spring Boot, Spring Security e Spring Data JPA.
- **Banco de dados:** PostgreSQL 16.
- **Autenticação:** JWT e BCrypt.
- **Ambiente local:** Docker Compose (opcional, mas recomendado).

## 1. Pré-requisitos

Antes de executar o projeto, instale as ferramentas necessárias.

| Ferramenta | Finalidade |
|---|---|
| Git | Clonar o repositório |
| Node.js 22 ou superior | Executar o frontend |
| npm | Instalar as dependências do frontend; acompanha o Node.js |
| Docker Desktop | Executar o backend e PostgreSQL em containers |
| Java JDK 21 | Necessário para executar o backend sem Docker |
| Maven | Gerenciar e executar o backend sem Docker |

**Importante:** se você utilizar Docker para executar o backend e o banco, não precisará instalar Java, Maven ou PostgreSQL diretamente no computador para esse modo de execução.

Links para instalação:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Java JDK 21](https://adoptium.net/)
- [Apache Maven](https://maven.apache.org/download.cgi)

## 2. Clonar o repositório

Abra um terminal e execute:

```bash
git clone https://github.com/davi011205/almoxarifado
```

A estrutura principal do projeto é:

```text
almoxarifado/
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   └── smsgroup/
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── docker-compose.yml
└── render.yaml
```

## 3. Executar o backend e o banco de dados

### Opção A — Usando Docker Compose (recomendado)

Certifique-se de que o Docker Desktop esteja aberto.

Na raiz do projeto, execute:

```bash
docker compose up --build
```

Esse comando inicia o PostgreSQL e compila e executa o backend Spring Boot.

Aguarde até que os containers estejam em execução e a aplicação tenha iniciado.

**Endereços locais:**

- API: `http://localhost:8080`
- Verificação de saúde da API: `http://localhost:8080/api/health`
- PostgreSQL: `localhost:5432`

Para encerrar os serviços, pressione `Ctrl + C` e execute:

```bash
docker compose down
```

Os dados do PostgreSQL são armazenados em um volume Docker e permanecem salvos ao parar os containers com o comando acima.

Para iniciar novamente sem reconstruir as imagens:

```bash
docker compose up -d
```

### Opção B — Executando Java e PostgreSQL localmente

Se preferir não utilizar Docker, será necessário ter Java 21, Maven e PostgreSQL instalados.

**Passo 1 — Criar o banco**

No PostgreSQL, crie um banco chamado `almoxarifado` e um usuário com permissão para acessá-lo.

**Passo 2 — Configurar as variáveis de ambiente**

No PowerShell do Windows, configure os dados de conexão:

```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/almoxarifado"
$env:SPRING_DATASOURCE_USERNAME="SEU_USUARIO"
$env:SPRING_DATASOURCE_PASSWORD="SUA_SENHA"
$env:JWT_SECRET="sua-chave-aleatoria-com-mais-de-32-caracteres"
$env:ADMIN_USERNAME="davi"
$env:ADMIN_PASSWORD="1234"
$env:ADMIN_NAME="Administrador"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173"
```

Substitua `SEU_USUARIO` e `SUA_SENHA` pelas credenciais do PostgreSQL instalado na máquina.

Esses valores ficam disponíveis somente na sessão atual do terminal. Em ambientes compartilhados, configure uma chave JWT e uma senha de administrador fortes.

**Passo 3 — Iniciar o backend**

Na raiz do projeto, execute:

```powershell
cd backend
mvn spring-boot:run
```

Se o projeto disponibilizar o Maven Wrapper, você também poderá executar:

```powershell
.\mvnw.cmd spring-boot:run
```

A API estará disponível em `http://localhost:8080`.

## 4. Executar o frontend

O frontend é executado separadamente do backend.

Abra um novo terminal na raiz do projeto e execute:

```bash
cd frontend/smsgroup
npm install
npm run dev
```

Após iniciar o Vite, acesse o endereço exibido no terminal. Normalmente:

`http://localhost:5173`

No ambiente local, o Vite encaminha as requisições que começam com `/api` para o backend em `http://localhost:8080`.

**Importante:** mantenha o backend e o PostgreSQL em execução enquanto utiliza o frontend.

## 5. Acessar o sistema

No ambiente local iniciado pelo Docker Compose, as credenciais administrativas padrão são:

- **Usuário:** `davi`
- **Senha:** `1234`

No modo sem Docker, as credenciais iniciais dependem das variáveis `ADMIN_USERNAME` e `ADMIN_PASSWORD` configuradas antes da primeira inicialização.

## 6. Verificar o funcionamento

Após iniciar os serviços:

1. Acesse o frontend pelo navegador.
2. Entre com as credenciais administrativas configuradas.
3. Cadastre um produto ou funcionário.
4. Consulte o estoque ou o histórico de movimentações.
5. Verifique se os dados permanecem disponíveis após atualizar a página.

Para conferir a API, acesse:

`http://localhost:8080/api/health`

Para consultar os logs do Docker:

```bash
docker compose logs -f backend
```

Para acompanhar o PostgreSQL:

```bash
docker compose logs -f postgres
```

## 7. Persistência dos dados

O sistema utiliza PostgreSQL como fonte central dos dados.

São persistidos, entre outros:

- Funcionários e seus perfis de acesso.
- Produtos, saldos e parâmetros de estoque.
- Movimentações de entrada e retirada.
- Configurações de reposição.
- Notas de reposição.

Os dados ficam compartilhados entre os usuários conectados à mesma instância da API.
---
