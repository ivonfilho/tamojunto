# Banco de dados (Railway) e comandos de deploy

## Banco PostgreSQL no Railway

- **DATABASE_URL** e **DATABASE_PUBLIC_URL** são configuradas nas variáveis de ambiente do serviço no Railway. Não é necessário colocá-las no código.
- O backend em produção usa `Environment.GetEnvironmentVariable("DATABASE_URL")` (já configurado no `Program.cs`).
- **Acesso externo ao banco** (ex.: sua máquina, DBeaver): use a variável **DATABASE_PUBLIC_URL** que o Railway mostra no dashboard do serviço Postgres (host público `centerbeam.proxy.rlwy.net`).

### Acesso via terminal (exemplo)

Use o comando que o Railway mostra no dashboard (Variáveis → conexão pública). O formato é:

```bash
PGPASSWORD=<sua_senha> psql -h centerbeam.proxy.rlwy.net -p 59625 -U postgres -d railway -c "SELECT current_database();"
```

Guarde a senha só em variáveis de ambiente ou em um arquivo local **não versionado** (ex.: `.env` na pasta da API, com `.env` no `.gitignore`).

---

## Build e deploy

### Frontend (Ionic)

```bash
cd ionic
npm run build:prod
```

Saída em `ionic/www/`. Para servir localmente:

```bash
npm run serve:prod
```

### Backend (deploy no Railway)

O **Project ID** fica na URL do **projeto** no dashboard (não do serviço de banco):

- Abra **https://railway.app/dashboard** → clique no **projeto** (nome do app).
- URL do tipo: `https://railway.app/project/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
- Esse `XXXXXXXX-...` é o **Project ID**.

Depois:

```bash
cd ~/Documentos/DELTAPOINT/tamo-junto
railway link --project SEU_PROJECT_ID
railway up
```

Ou só a API:

```bash
cd ~/Documentos/DELTAPOINT/tamo-junto/TamoJunto.API
railway link --project SEU_PROJECT_ID
railway up
```

**Observação:** O ID `60a6023a-2adf-462b-9171-20ae8543d7b8` que você viu é provavelmente do **serviço** (ex.: Postgres), não do **projeto**. Use o ID que aparece na URL quando você está no projeto (painel principal do app).

---

## Segurança

- Não commite senhas ou connection strings completas no Git.
- No Railway, use apenas as variáveis de ambiente (DATABASE_URL, etc.) definidas no dashboard.
- O `Program.cs` não imprime mais a connection string nos logs em produção.
