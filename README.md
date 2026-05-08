# Sistema de Agendamento - Jardinagem

Página estática hospedada no GitHub Pages, integrada ao Google Calendar via Google Apps Script. **Sem servidor, sem banco de dados, sem custo.**

## Arquitetura

```
Cliente (navegador)
   ↓
GitHub Pages (index.html / style.css / script.js)
   ↓ fetch
Google Apps Script (Web App)
   ↓
Google Calendar do jardineiro
```

## Estrutura dos arquivos

| Arquivo          | Onde mora                       |
|------------------|---------------------------------|
| `index.html`     | GitHub Pages (frontend)         |
| `style.css`      | GitHub Pages (frontend)         |
| `script.js`      | GitHub Pages (frontend)         |
| `apps-script.gs` | Google Apps Script (backend)    |

---

## Passo a passo de deploy

### 1. Configurar o backend (Google Apps Script)

1. Acesse https://script.google.com → **Novo projeto**
2. Apague o `Code.gs` padrão e cole o conteúdo de **`apps-script.gs`**
3. (Opcional) Edite as constantes no topo:
   - `SERVICES` - lista de serviços e duração (deve **espelhar** `script.js`)
   - `WORK_HOURS` - horário de trabalho (ex: `{ start: 8, end: 18 }`)
   - `WORK_DAYS` - dias da semana atendidos (0=Dom, 1=Seg, ...)
   - `CALENDAR_ID` - deixe `'primary'` para usar o calendário principal
4. Salvar (**Ctrl+S**), dê um nome ao projeto (ex: "Agendamento Jardinagem")
5. Clique em **Implantar** → **Nova implantação**
6. Tipo: **App da Web**
7. Configurações importantes:
   - Executar como: **Eu mesmo**
   - Quem tem acesso: **Qualquer pessoa**
8. Clique **Implantar** → autorize quando o Google pedir (precisa permitir acesso ao Calendar)
9. **Copie a URL** que aparece no final (termina em `/exec`)

### 2. Configurar o frontend

1. Abra `script.js`
2. Substitua `COLE_AQUI_A_URL_DO_APPS_SCRIPT` pela URL copiada no passo 9
3. (Opcional) Edite o array `SERVICES` para refletir os serviços reais — **mantenha os mesmos `id` e `duration` que estão no `apps-script.gs`**

### 3. Subir no GitHub Pages

1. Crie um repositório público no GitHub (ex: `agendamento-jardinagem`)
2. Faça upload dos arquivos: `index.html`, `style.css`, `script.js`
   - Pode arrastar pelo navegador na página do repo
3. No repo: **Settings** → **Pages** (menu lateral)
4. Source: **Deploy from a branch** → branch `main` → folder `/ (root)` → **Save**
5. Em 1-2 minutos a URL aparece: `https://SEU_USUARIO.github.io/agendamento-jardinagem/`

### 4. Como o jardineiro usa no dia a dia

- **Bloquear horário (almoço, compromisso pessoal):** criar evento normalmente no Google Calendar — o sistema não oferecerá slots conflitantes
- **Ver agendamentos:** todos aparecem no Google Calendar com nome do cliente
- **Notificações:** o Google Calendar já manda lembretes nativos
- **Cancelar:** apagar o evento no Calendar (pode adicionar etapa de avisar o cliente)

---

## Atualizando depois

Quando alterar `apps-script.gs`:
- **Implantar** → **Gerenciar implantações** → ícone de lápis → **Versão: Nova versão** → **Implantar**
- A URL **continua a mesma**, então não precisa atualizar o frontend

Quando alterar arquivos do frontend:
- Faça commit/push no GitHub — o Pages atualiza sozinho em 1-2 minutos

---

## Customizações comuns

**Adicionar/remover serviços:** editar o array `SERVICES` em **dois lugares** — `script.js` (frontend) e `apps-script.gs` (backend). Os `id`s precisam bater.

**Mudar horário de funcionamento:** editar `WORK_HOURS` em `apps-script.gs`.

**Atender domingos:** adicionar `0` em `WORK_DAYS`.

**Usar calendário separado** (não misturar com pessoal): criar um calendário novo em calendar.google.com → Configurações → copiar o "ID do calendário" → colar em `CALENDAR_ID`.

**Receber email de cada novo agendamento:** adicionar `MailApp.sendEmail(...)` no final da função `createBooking` no `apps-script.gs`.

---

## Limitações

- Apps Script tem cotas grátis generosas (~20.000 chamadas/dia) — mais que suficiente para um prestador autônomo
- Não há autenticação de cliente — qualquer um com o link pode agendar (adequado pro caso de uso)
- A primeira chamada do dia pode demorar 2-3 segundos (cold start do Apps Script)
