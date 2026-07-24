# Deploy no Railway – correção do erro "Available options can not be empty"

## Já feito por você

- **Railway CLI atualizado** para a versão **4.31.0** (era 4.5.5).
- **`railway list --json`** continua retornando lista vazia `[]` para a sua conta, então o link precisa ser feito **por Project ID**.

### Project ID que você informou

`df337204-b6e1-4b07-b3ed-e4545e81ea88`

Ao testar, o CLI retornou: *"Project was not found in the tamojunto_app's Projects workspace"*. Se o projeto estiver em um **team/workspace** diferente, use `railway link --workspace NOME_DO_WORKSPACE --project df337204-b6e1-4b07-b3ed-e4545e81ea88`.

### Comandos para testar no seu terminal

1. Linkar (na pasta do projeto ou da API):

```bash
cd ~/Documentos/DELTAPOINT/tamo-junto
railway link --project df337204-b6e1-4b07-b3ed-e4545e81ea88
railway up
```

Se o deploy for só da API, use a pasta da API:

```bash
cd ~/Documentos/DELTAPOINT/tamo-junto/TamoJunto.API
railway link --project df337204-b6e1-4b07-b3ed-e4545e81ea88
railway up
```

---

## O que está acontecendo

- **Login:** está ok (`railway whoami` mostra tamojunto_app).
- **Lista de projetos:** vem vazia, por isso o `railway link` falha com "Available options can not be empty".
- Sua CLI está na **4.5.5**; a mais recente é a **4.31.0**. Esse bug costuma ser resolvido atualizando o CLI.

---

## Passo 1: Atualizar o Railway CLI

No terminal:

```bash
npm install -g @railway/cli@latest
```

Confirme a versão:

```bash
railway --version
```

(deve ser 4.31.x ou superior)

---

## Passo 2: Linkar por ID (se o `railway link` ainda não mostrar projetos)

1. Abra o **Railway Dashboard**: https://railway.app/dashboard  
2. Entre no **projeto** do backend (Tamo Junto API).
3. Pegue o **Project ID**:
   - Na URL do projeto aparece algo como:  
     `https://railway.app/project/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`  
   - O **Project ID** é essa parte: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
4. No terminal, na pasta do projeto:

```bash
cd ~/Documentos/DELTAPOINT/tamo-junto
railway link --project SEU_PROJECT_ID
```

Substitua `SEU_PROJECT_ID` pelo ID que você copiou.

Se pedir **environment**, use o nome (ex.: `production`) ou o ID do ambiente.

Se pedir **service**, use o nome do serviço (ex.: o nome do backend no dashboard).

---

## Passo 3: Deploy

Depois de linkar:

```bash
railway up
```

Se você costuma fazer deploy só do backend:

```bash
cd ~/Documentos/DELTAPOINT/tamo-junto/TamoJunto.API
railway link --project SEU_PROJECT_ID
railway up
```

---

## Alternativa: deploy com token (sem `railway link`)

1. No Railway Dashboard: projeto → **Settings** → **Tokens** → **Create Token** (Project Token).
2. Copie o token.
3. No dashboard, anote o **Project ID** (URL do projeto) e o **Service ID** (em Settings do serviço ou na URL do serviço).
4. No terminal:

```bash
cd ~/Documentos/DELTAPOINT/tamo-junto
RAILWAY_TOKEN=seu_token_aqui railway up --project SEU_PROJECT_ID --service SEU_SERVICE_ID
```

(Substitua `seu_token_aqui`, `SEU_PROJECT_ID` e `SEU_SERVICE_ID`.)

---

## Se ainda não tiver projeto no Railway

Se a lista continuar vazia mesmo após atualizar e você não tiver criado o projeto ainda:

1. Acesse https://railway.app/dashboard  
2. **New Project** → **Deploy from GitHub** ou **Empty Project**.  
3. Depois de criar, use o Project ID no `railway link --project ...` como acima.
