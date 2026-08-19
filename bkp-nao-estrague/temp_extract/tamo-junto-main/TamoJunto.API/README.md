# Tamo Junto API

## 🚀 Deploy no Railway

### 1. Criar conta no Railway
- Acesse: https://railway.app
- Faça login com GitHub

### 2. Criar novo projeto
- Clique "Start a New Project"
- Selecione "Deploy from GitHub repo"
- Conecte seu repositório

### 3. Configurar variáveis de ambiente
No Railway, vá em **Variables** e adicione:

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:8080
DATABASE_URL=postgresql://postgres:lbjFdixokkbjiMIibrbemdYKaaGOJoNp@postgres.railway.internal:5432/railway
MercadoPago__AccessToken=APP_USR-912284684934310-061018-b7ce77c6b221caa1818f57ead0ee1fe0-206207657
MercadoPago__PublicKey=APP_USR-bed410b7-cc2e-44b5-a4a3-2931cb03d4cc
MercadoPago__ClientId=912284684934310
MercadoPago__ClientSecret=naifuBPlhttxbCB2YHXENzhjqjwYKAAt
```

### 4. Configurar domínio personalizado
- Railway → Settings → Domains
- Adicionar: `api.tamojunto.net`
- Configurar DNS no Hostinger

### 5. Deploy automático
O Railway fará deploy automático quando você fizer push para o GitHub.

### 6. Verificar saúde da aplicação
- Endpoint de health check: `/health`
- Deve retornar status "healthy" com database "connected"

## 📁 Estrutura do Projeto

```
TamoJunto.API/
├── Controllers/          # Controllers da API
├── RequestModel/         # Modelos de request
├── Dtos/                # Data Transfer Objects
├── Mappings/            # AutoMapper mappings
├── Utils/               # Utilitários
├── railway.json         # Configuração Railway
├── Dockerfile           # Container Docker
├── Procfile             # Comando de inicialização
└── README.md           # Este arquivo
```

## 🔧 Tecnologias

- **.NET 8.0**
- **Entity Framework Core**
- **PostgreSQL** (Produção e Desenvolvimento)
- **AutoMapper**
- **JWT Authentication**
- **Swagger/OpenAPI**

## 🌐 Endpoints

- **Health Check**: `/health`
- **Swagger**: `/swagger` (apenas em desenvolvimento)
- **API Base**: `/api/*`

## 📊 Banco de Dados

O projeto usa PostgreSQL tanto em desenvolvimento quanto em produção.
- **Desenvolvimento**: Servidor externo (104.196.117.15)
- **Produção**: PostgreSQL no Railway

## 🐳 Docker

A aplicação está configurada para rodar em container Docker:
- Porta: 8080
- Ambiente: Production
- Health check configurado

## 🔍 Troubleshooting

### Problemas comuns:
1. **Erro de conexão com banco**: Verificar se DATABASE_URL está configurada
2. **Porta não acessível**: Verificar se ASPNETCORE_URLS está configurado
3. **Migrações falhando**: Verificar logs da aplicação

### Logs importantes:
- Verificar logs do Railway para erros de deploy
- Endpoint `/health` para status da aplicação
- Logs de migração automática no console 