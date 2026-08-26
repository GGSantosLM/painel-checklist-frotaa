# Diretiva: Sincronização da Planilha Google Sheets

## Objetivo
Sincronizar periodicamente ou sob demanda as respostas enviadas pelos motoristas através do formulário do Google Sheets para o painel web local/hospedado.

## Parâmetros da Planilha
- **Sheet ID**: `1OXapsWbWJj_TuNgYw9PUo1ydlzHMSJ7HCAaa_m1YIok`
- **GID (Aba Respostas)**: `667476341`
- **URL de Exportação**: `https://docs.google.com/spreadsheets/d/1OXapsWbWJj_TuNgYw9PUo1ydlzHMSJ7HCAaa_m1YIok/export?format=csv&gid=667476341`

## Ferramenta de Execução
- **Script**: `execution/sync_sheets.js`
- **Comando**: `node execution/sync_sheets.js`
- **Saída**: `src/data/checklist_data.csv`

## Tratamento de Erros e Edge Cases
- Em caso de falha de conexão (offline), o painel web utiliza o fallback com o snapshot estático já embutido no `app.js`.
- Anos incorretos (como `0026` ou `2025` digitados na planilha) são tratados e corrigidos automaticamente pelo parser para `2026`.
