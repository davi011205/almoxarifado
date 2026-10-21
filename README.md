# Sistema de Almoxarifado - MVP Hacktown oi

Bem-vindo ao repositório do **Sistema de Almoxarifado**, um MVP desenvolvido para o Hacktown. O objetivo deste projeto é modernizar, agilizar e rastrear o processo de estoque, retirada e reposição de materiais, eliminando gargalos através de um sistema web eficiente.

## 🚀 Tecnologias Utilizadas

O sistema adota uma arquitetura baseada em microsserviços/API REST:
*   **Backend:** Java
*   **Frontend:** React

## 🎯 Funcionalidades Principais (MVP)

*   **Autenticação Simples e Segura:** Login de funcionários utilizando apenas o CPF.
*   **Gestão de Estoque Completa:** Listagem de produtos no estoque em tempo real.
*   **Busca Inteligente:** Consulta de produtos por nome ou marca.
*   **Mapeamento de Prateleiras:** Sistema de localização de itens por coordenadas (Ex: Corredor X, Prateleira Letra Y), facilitando a navegação de novos colaboradores no almoxarifado.
*   **Controle de Reposição:** Fluxo dedicado para adição de itens, identificando automaticamente o funcionário responsável.
*   **Controle de Retirada:** Fluxo dedicado para saída de produtos, atrelando a retirada a um funcionário e a um projeto de destino.
*   **Alertas Automatizados:** Monitoramento de capacidade mínima com envio de avisos (ex: WhatsApp) ou geração de pedido de reposição automático para o Centro de Distribuição (CD).
*   **Geração de Guias:** Emissão automática de relatórios a cada transação (retirada ou reposição), indicando quem fez, quando fez, e o que foi movimentado.

## 📦 Estrutura de Dados do Item

Cada produto no sistema é definido pelos seguintes atributos:
*   **Nome** do produto.
*   **Código** (lido via código de barras ou QR Code).
*   **Quantidade** (unidades disponíveis).
*   **Coordenada** (localização exata nas prateleiras).
*   **Quantidade Mínima** (gatilho para o alerta de reposição).

## 🔄 Fluxos de Utilização

### 📥 Processo de Reposição
1. Acessar a conta validando a credencial (CPF).
2. Selecionar a opção de **Reposição de Produtos**.
3. Utilizar a câmera do celular para ler o QR Code/Código de Barras do item (ou inserir o nome manualmente).
4. Inserir a quantidade a ser reposta (integração futura com visão computacional para contagem automática).
5. Repetir os passos 3 e 4 conforme necessário.
6. Encerrar o processo. O sistema gerará automaticamente uma guia registrando o responsável, o horário e os itens repostos.

### 📤 Processo de Retirada
1. Acessar a conta validando a credencial (CPF).
2. Selecionar a opção de **Retirada de Itens**.
3. Inserir o nome do projeto para o qual os materiais estão sendo destinados.
4. Utilizar a câmera do celular para ler o QR Code/Código de Barras do item.
5. Inserir a quantidade retirada (integração futura com visão computacional).
6. Repetir os passos 4 e 5 conforme necessário.
7. Encerrar o pedido. O sistema gerará uma guia indicando o responsável, o horário, os itens e o projeto de destino.

## ⚖️ Prós e Contras do Sistema

**Prós:**
*   Contagem exata e atualizada da quantidade de itens armazenados em tempo real.
*   Processo 100% online, realizado durante a própria retirada/reposição dos itens.
*   Geração instantânea de guias para auditoria de entradas e saídas.
*   Permite acesso simultâneo de várias pessoas ao almoxarifado; cada colaborador gerencia sua própria coleta sem gargalos de espera.

**Contras (Pontos de Atenção):**
*   O cadastro de novos itens (nunca antes armazenados) exige uma etapa manual de inserção no sistema e, futuramente, o treinamento do modelo de visão computacional para reconhecê-los.
