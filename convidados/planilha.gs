/**
 * Lista de convidados — Kaique & Maê
 *
 * Script da planilha Google. A página /convidados/ do site lê e grava a lista
 * por aqui: qualquer pessoa com o link da página consegue marcar e adicionar.
 *
 * Colunas da primeira aba: id | lista | nome | confirmado | crianca
 * Dá para mexer direto na planilha também: arrastar linhas muda a ordem,
 * corrigir nomes e incluir gente (o id é criado sozinho na próxima leitura).
 *
 * Instalação: Extensões > Apps Script, colar este arquivo, salvar e
 * Implantar > Nova implantação > App da Web (Executar como: eu;
 * Quem pode acessar: qualquer pessoa).
 */

const COLUNAS = ['id', 'lista', 'nome', 'confirmado', 'crianca'];
const LISTAS = ['Kaique', 'Maê'];

// ---------- entrada ----------
function doGet() {
  return responder(function () {
    return { ok: true, convidados: ler() };
  });
}

function doPost(e) {
  return responder(function () {
    const op = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    aplicar(op);
    return { ok: true, convidados: ler() };
  });
}

// uma pessoa de cada vez: evita duas gravações ao mesmo tempo
function responder(fn) {
  const trava = LockService.getScriptLock();
  let resposta;
  try {
    trava.waitLock(25000);
    resposta = fn();
  } catch (erro) {
    resposta = { ok: false, erro: String((erro && erro.message) || erro) };
  } finally {
    try { trava.releaseLock(); } catch (e) { /* já liberada */ }
  }
  return ContentService.createTextOutput(JSON.stringify(resposta))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- planilha ----------
function aba() {
  const a = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (a.getLastRow() === 0) a.appendRow(COLUNAS);
  preparar(a);
  return a;
}

// Só na primeira vez: congela o cabeçalho, põe caixinhas de marcar e a
// lista suspensa Kaique/Maê (sem mudar nenhum valor que já está lá).
function preparar(a) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('preparada') === '1') return;
  a.setFrozenRows(1);
  formatar(a, 2, a.getLastRow() - 1);
  props.setProperty('preparada', '1');
}

function formatar(a, primeira, quantas) {
  if (quantas < 1) return;
  const caixa = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  const lista = SpreadsheetApp.newDataValidation().requireValueInList(LISTAS, true).setAllowInvalid(true).build();
  a.getRange(primeira, 4, quantas, 2).setDataValidation(caixa);
  a.getRange(primeira, 2, quantas, 1).setDataValidation(lista);
}

function ler() {
  const a = aba();
  const n = a.getLastRow() - 1;
  if (n < 1) return [];
  const valores = a.getRange(2, 1, n, 5).getValues();
  let criouId = false;
  const saida = [];
  valores.forEach(function (l) {
    const nome = limpar(l[2]);
    if (!nome) return;
    if (!String(l[0]).trim()) { l[0] = novoId(); criouId = true; }   // linha incluída à mão
    saida.push({
      id: String(l[0]).trim(),
      lista: qualLista(l[1]),
      nome: nome,
      confirmado: sim(l[3]),
      crianca: sim(l[4]),
    });
  });
  if (criouId) a.getRange(2, 1, n, 1).setValues(valores.map(function (l) { return [l[0]]; }));
  return saida;
}

function aplicar(op) {
  if (['adicionar', 'marcar', 'crianca', 'remover'].indexOf(op.tipo) < 0) {
    throw new Error('pedido desconhecido: ' + op.tipo);
  }
  const a = aba();

  if (op.tipo === 'adicionar') {
    const nome = limpar(op.nome).slice(0, 80);
    if (!nome) throw new Error('nome vazio');
    const id = /^[0-9a-z]{6,16}$/.test(String(op.id || '')) ? String(op.id) : novoId();
    if (linhaDoId(a, id) > 0) return;               // pedido repetido: já está na planilha
    const lista = qualLista(op.lista);
    // entra logo depois do último convidado da mesma lista
    let depois = a.getLastRow();
    const n = a.getLastRow() - 1;
    if (n > 0) {
      const col = a.getRange(2, 2, n, 2).getValues();
      for (let i = n - 1; i >= 0; i--) {
        if (limpar(col[i][1]) && qualLista(col[i][0]) === lista) { depois = i + 2; break; }
      }
    }
    a.insertRowAfter(depois);
    a.getRange(depois + 1, 1, 1, 5).setValues([[id, lista, nome, false, op.crianca === true]]);
    formatar(a, depois + 1, 1);
    return;
  }

  const linha = linhaDoId(a, String(op.id || ''));
  if (linha < 0) return;                            // alguém já tinha removido
  if (op.tipo === 'marcar') {
    a.getRange(linha, 4).setValue(op.valor === true);
  } else if (op.tipo === 'crianca') {
    a.getRange(linha, 5).setValue(op.valor === true);
  } else if (op.tipo === 'remover') {
    if (a.getLastRow() <= 2) a.getRange(linha, 1, 1, 5).clearContent();   // a planilha não deixa apagar a última linha
    else a.deleteRow(linha);
  }
}

// ---------- utilidades ----------
function linhaDoId(a, id) {
  const n = a.getLastRow() - 1;
  if (!id || n < 1) return -1;
  const ids = a.getRange(2, 1, n, 1).getValues();
  for (let i = 0; i < n; i++) if (String(ids[i][0]).trim() === id) return i + 2;
  return -1;
}

function limpar(v) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
}

function qualLista(v) {
  const t = limpar(v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return t.charAt(0) === 'k' ? 'Kaique' : 'Maê';
}

function sim(v) {
  return v === true || /^(true|verdadeiro|sim|x|1)$/i.test(limpar(v));
}

function novoId() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 8);
}
