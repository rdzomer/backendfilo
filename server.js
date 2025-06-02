// server.js
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SHEET_NAME = 'Pedidos';
const SPREADSHEET_TITLE = 'Filó Cetim - Pedidos';

// Autenticação com Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getSheet() {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // Busca pelo ID da planilha com o título exato
  const spreadsheetId = process.env.SPREADSHEET_ID;
  return { sheets, spreadsheetId };
}

app.post('/salvar-pedido', async (req, res) => {
  const { pedido, numeroPedido } = req.body;

  if (!pedido || !pedido.items || pedido.items.length === 0) {
    return res.status(400).json({ error: 'Pedido inválido' });
  }

  try {
    const { sheets, spreadsheetId } = await getSheet();

    const rows = pedido.items.map(item => [
      numeroPedido,
      new Date().toLocaleString('pt-BR'),
      pedido.customer.firstName,
      pedido.customer.lastName,
      pedido.customer.cpf,
      pedido.customer.address.street,
      pedido.customer.address.cep,
      pedido.customer.address.city,
      pedido.customer.address.state,
      item.productName,
      item.quantity,
      item.unitPrice,
      item.totalPrice,
      pedido.eventDate,
      pedido.status,
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });

    res.status(200).json({ message: 'Dados salvos com sucesso na planilha.' });
  } catch (error) {
    console.error('Erro ao salvar pedido:', error);
    res.status(500).json({ error: 'Erro ao salvar pedido.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
