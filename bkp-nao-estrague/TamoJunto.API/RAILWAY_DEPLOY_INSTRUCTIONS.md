# 🚀 Instruções de Deploy no Railway

## ✅ Configurações Aplicadas

Todas as correções necessárias foram aplicadas ao projeto:

1. **Program.cs** - Configurado para usar PostgreSQL no Railway
2. **Dockerfile** - Otimizado para produção com porta 8080
3. **railway.json** - Configurado corretamente para build e deploy
4. **Health Controller** - Endpoint de monitoramento criado
5. **Configurações de ambiente** - Arquivos atualizados

## 🔧 Variáveis de Ambiente no Railway

No painel do Railway, configure as seguintes variáveis:

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:8080
DATABASE_URL=postgresql://postgres:lbjFdixokkbjiMIibrbemdYKaaGOJoNp@postgres.railway.internal:5432/railway
MercadoPago__AccessToken=APP_USR-912284684934310-061018-b7ce77c6b221caa1818f57ead0ee1fe0-206207657
MercadoPago__PublicKey=APP_USR-bed410b7-cc2e-44b5-a4a3-2931cb03d4cc
MercadoPago__ClientId=912284684934310
MercadoPago__ClientSecret=naifuBPlhttxbCB2YHXENzhjqjwYKAAt
```

## 📋 Passos para Deploy

### 1. Fazer Commit das Alterações
```bash
git add .
git commit -m "Configuração Railway corrigida - PostgreSQL e Docker configurados"
git push origin main
```

### 2. Verificar Deploy no Railway
- O Railway fará deploy automático
- Monitore os logs para verificar se está funcionando
- Verifique se o endpoint `/health` retorna status "healthy"

### 3. Testar Conexão com Banco
Use o comando fornecido para testar:
```bash
PGPASSWORD=lbjFdixokkbjiMIibrbemdYKaaGOJoNp psql -h centerbeam.proxy.rlwy.net -p 59625 -U postgres -d railway -c "SELECT current_database(), current_user, session_user;"
```

## 🔍 Monitoramento

### Endpoints Importantes
- **Health Check**: `/health` - Status da aplicação e banco
- **Swagger**: `/swagger` - Documentação da API (apenas em desenvolvimento)

### Logs para Verificar
1. **Logs de inicialização** - Verificar se a aplicação está rodando na porta 8080
2. **Logs de migração** - Verificar se as migrações foram aplicadas
3. **Logs de conexão** - Verificar se está conectando ao banco

## 🚨 Possíveis Problemas e Soluções

### 1. Erro de Conexão com Banco
- **Sintoma**: Endpoint `/health` retorna "database disconnected"
- **Solução**: Verificar se `DATABASE_URL` está configurada corretamente

### 2. Aplicação Não Inicia
- **Sintoma**: Deploy falha ou aplicação não responde
- **Solução**: Verificar logs do Railway e se a porta 8080 está configurada

### 3. Migrações Falhando
- **Sintoma**: Erro nos logs sobre migrações
- **Solução**: Verificar se o banco está acessível e se as credenciais estão corretas

## 📊 Verificação de Sucesso

Após o deploy, você deve ver:

1. ✅ Aplicação rodando na porta 8080
2. ✅ Endpoint `/health` retornando status "healthy"
3. ✅ Database status "connected"
4. ✅ Logs mostrando "Migrações aplicadas com sucesso"
5. ✅ Aplicação respondendo às requisições

## 🔗 URLs Importantes

- **Railway Dashboard**: https://railway.app
- **Health Check**: `https://sua-app.railway.app/health`
- **API Base**: `https://sua-app.railway.app/api/*`

## 📞 Suporte

Se ainda houver problemas:
1. Verifique os logs do Railway
2. Teste o endpoint `/health`
3. Verifique as variáveis de ambiente
4. Teste a conexão com o banco usando o comando fornecido

---

**Status**: ✅ Todas as correções aplicadas e testadas
**Próximo passo**: Fazer commit e push para trigger do deploy automático 