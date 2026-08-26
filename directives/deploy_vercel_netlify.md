# Diretiva: Deploy no Vercel / Netlify

## Objetivo
Publicar o Painel Checklist Frota gratuitamente em uma URL pública acessível em qualquer dispositivo (computador, tablet, smartphone).

---

## Opção A: Deploy via Vercel (Recomendado)

### 1. Via CLI (Linha de Comando)
1. Instale o Vercel CLI (se ainda não tiver):
   ```bash
   npm i -g vercel
   ```
2. No terminal dentro da pasta do projeto, execute:
   ```bash
   vercel
   ```
3. Siga as instruções no terminal (fazer login, confirmar as configurações padrão). O arquivo `vercel.json` configurará automaticamente a pasta `src/` e o comando de build.
4. Para deploy em produção:
   ```bash
   vercel --prod
   ```

### 2. Via Painel Web do Vercel (com GitHub)
1. Suba o código para o seu repositório no GitHub.
2. Acesse [vercel.com](https://vercel.com) e faça login.
3. Clique em **"Add New" > "Project"**.
4. Importe o repositório `painel-checklist-frota`.
5. O Vercel detectará o arquivo `vercel.json` automaticamente. Clique em **Deploy**.

---

## Opção B: Deploy via Netlify

### 1. Via Drag-and-Drop (Sem código/CLI)
1. Acesse [app.netlify.com](https://app.netlify.com).
2. Arraste a pasta `src` diretamente na área **"Drag and drop your site output folder here"**.
3. O link público será gerado instantaneamente.

### 2. Via Git / Netlify CLI
1. Conecte o repositório do GitHub no painel da Netlify.
2. O arquivo `netlify.toml` já está configurado para publicar a pasta `src`.
