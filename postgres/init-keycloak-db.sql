-- Este script é executado automaticamente pelo PostgreSQL apenas na
-- primeira inicialização do volume (quando o diretório de dados está vazio).
--
-- Cria o banco de dados exclusivo do Keycloak, separado do banco da aplicação.
-- O Keycloak gerencia seu próprio schema dentro deste banco.

SELECT 'CREATE DATABASE keycloak_local'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'keycloak_local'
)\gexec
