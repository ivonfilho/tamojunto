-- Script para dropar todas as tabelas do banco de dados
-- Execute este script no PostgreSQL antes de aplicar a nova migração

-- Desabilitar verificação de chaves estrangeiras
SET session_replication_role = replica;

-- Dropar todas as tabelas
DROP TABLE IF EXISTS "ItemPedido" CASCADE;
DROP TABLE IF EXISTS "Pedido" CASCADE;
DROP TABLE IF EXISTS "HistoricoCupom" CASCADE;
DROP TABLE IF EXISTS "Notificacao" CASCADE;
DROP TABLE IF EXISTS "Imagem" CASCADE;
DROP TABLE IF EXISTS "OfertaParceiro" CASCADE;
DROP TABLE IF EXISTS "CupomCliente" CASCADE;
DROP TABLE IF EXISTS "Assinatura" CASCADE;
DROP TABLE IF EXISTS "Pagamento" CASCADE;
DROP TABLE IF EXISTS "Parceiro" CASCADE;
DROP TABLE IF EXISTS "Cliente" CASCADE;
DROP TABLE IF EXISTS "Backoffice" CASCADE;
DROP TABLE IF EXISTS "Endereco" CASCADE;
DROP TABLE IF EXISTS "HistoricoLogin" CASCADE;
DROP TABLE IF EXISTS "Usuario" CASCADE;
DROP TABLE IF EXISTS "Empresa" CASCADE;
DROP TABLE IF EXISTS "Plano" CASCADE;

-- Dropar tabelas com nomes em minúsculo que podem existir
DROP TABLE IF EXISTS "itempedido" CASCADE;
DROP TABLE IF EXISTS "pedido" CASCADE;
DROP TABLE IF EXISTS "historicocupom" CASCADE;
DROP TABLE IF EXISTS "notificacao" CASCADE;
DROP TABLE IF EXISTS "imagem" CASCADE;
DROP TABLE IF EXISTS "ofertaparceiro" CASCADE;
DROP TABLE IF EXISTS "cupomcliente" CASCADE;
DROP TABLE IF EXISTS "assinatura" CASCADE;
DROP TABLE IF EXISTS "pagamento" CASCADE;
DROP TABLE IF EXISTS "parceiro" CASCADE;
DROP TABLE IF EXISTS "cliente" CASCADE;
DROP TABLE IF EXISTS "backoffice" CASCADE;
DROP TABLE IF EXISTS "endereco" CASCADE;
DROP TABLE IF EXISTS "historicologin" CASCADE;
DROP TABLE IF EXISTS "usuario" CASCADE;
DROP TABLE IF EXISTS "empresa" CASCADE;
DROP TABLE IF EXISTS "plano" CASCADE;

-- Dropar tabelas com nomes em PascalCase que podem existir
DROP TABLE IF EXISTS "Parceiros" CASCADE;
DROP TABLE IF EXISTS "Clientes" CASCADE;

-- Dropar tabela de histórico de migrações
DROP TABLE IF EXISTS "__EFMigrationsHistory" CASCADE;

-- Reabilitar verificação de chaves estrangeiras
SET session_replication_role = DEFAULT; 