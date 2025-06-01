import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'Pedidos'; // Aba da planilha

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

app.post('/salvar-pedido', async (req, res) => {
  try {
    const { pedido, numeroPedido } = req.body;
    const c = pedido.customer;

    const clienteNome = `${c.firstName || ''} ${c.lastName || ''}`.trim();
    const endereco = c.address.street || '';
    const cidade = c.address.city || '';
    const estado = c.address.state || '';
    const cep = c.address.cep || '';
    const cpf = c.cpf || '';
    const status = pedido.status || '';
    const dataEvento = pedido.eventDate || '';
    const valorTotal = Number(pedido.totalAmount || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const itensTexto = pedido.items.map(item =>
      `${item.quantity}x ${item.productName}`
    ).join(', ');

    const dataCriacao = new Date(pedido.createdAt || Date.now()).toLocaleString('pt-BR');

    const values = [[
      pedido.id,
      numeroPedido,
      clienteNome,
      cpf,
      endereco,
      cidade,
      estado,
      cep,
      dataEvento,
      status,
      itensTexto,
      valorTotal,
      dataCriacao
    ]];

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    res.status(200).send({ success: true });
  } catch (error) {
    console.error('Erro ao salvar pedido:', error);
    res.status(500).send({ error: 'Erro ao salvar na planilha' });
  }
});

app.listen(3001, () => {
  console.log('Servidor rodando em http://localhost:3001');
});
