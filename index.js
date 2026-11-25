const express = require('express');
const fs = require('fs');
const app = express();

// O Render define a porta automaticamente na variável PORT
const PORT = process.env.PORT || 3000;
const ARQUIVO = 'estoque.json';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function carregarEstoque() {
  if (!fs.existsSync(ARQUIVO)) fs.writeFileSync(ARQUIVO, '[]');
  return JSON.parse(fs.readFileSync(ARQUIVO, 'utf-8'));
}

function salvarEstoque(estoque) {
  fs.writeFileSync(ARQUIVO, JSON.stringify(estoque, null, 2));
}

// Tela principal (HTML simples gerado pelo Node)
app.get('/', (req, res) => {
  const estoque = carregarEstoque();
  const linhas = estoque.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.nome}</td>
      <td><strong>${p.quantidade}</strong></td>
      <td>
        <form action="/movimentar" method="POST" style="display:inline;">
          <input type="hidden" name="id" value="${p.id}">
          <input type="number" name="qtd" value="1" min="1" style="width:50px;" required>
          <button type="submit" name="tipo" value="entrada">+ Entrada</button>
          <button type="submit" name="tipo" value="saida">- Saída</button>
        </form>
        <form action="/remover" method="POST" style="display:inline; margin-left:10px;">
          <input type="hidden" name="id" value="${p.id}">
          <button type="submit" style="color:red;">Excluir</button>
        </form>
      </td>
    </tr>
  `).join('');

  res.send(`
    <body style="font-family: sans-serif; max-width: 700px; margin: 40px auto;">
      <h2> Gestão de Estoque </h2>
      <form action="/cadastrar" method="POST" style="margin-bottom: 20px;">
        <input type="text" name="nome" placeholder="Nome do produto" required>
        <input type="number" name="quantidade" placeholder="Qtd inicial" min="0" required>
        <button type="submit">Cadastrar</button>
      </form>
      <table border="1" cellpadding="8" cellspacing="0" width="100%">
        <tr><th>ID</th><th>Produto</th><th>Quantidade</th><th>Ações</th></tr>
        ${linhas || '<tr><td colspan="4">Nenhum item cadastrado</td></tr>'}
      </table>
    </body>
  `);
});

app.post('/cadastrar', (req, res) => {
  const { nome, quantidade } = req.body;
  const estoque = carregarEstoque();
  const id = estoque.length > 0 ? estoque[estoque.length - 1].id + 1 : 1;
  estoque.push({ id, nome, quantidade: parseInt(quantidade) });
  salvarEstoque(estoque);
  res.redirect('/');
});

app.post('/movimentar', (req, res) => {
  const { id, qtd, tipo } = req.body;
  const estoque = carregarEstoque();
  const produto = estoque.find(p => p.id === parseInt(id));
  const valor = parseInt(qtd);

  if (produto && valor > 0) {
    if (tipo === 'entrada') produto.quantidade += valor;
    if (tipo === 'saida' && produto.quantidade >= valor) produto.quantidade -= valor;
    salvarEstoque(estoque);
  }
  res.redirect('/');
});

app.post('/remover', (req, res) => {
  const estoque = carregarEstoque().filter(p => p.id !== parseInt(req.body.id));
  salvarEstoque(estoque);
  res.redirect('/');
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));