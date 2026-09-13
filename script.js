// =========================================================
// Configuração
// =========================================================

// Lista de presentes na Amazon
const LINK_LISTA = "https://www.amazon.com.br/hz/wishlist/ls/1AAWXC4XKUW7O?ref_=wl_share";

// Pix "copia e cola" (sem valor fixo — o convidado escolhe quanto doar).
// Se trocar este código, gere um QR code novo para img/pix-qr.svg.
const PIX_COPIA_E_COLA = "00020101021126580014br.gov.bcb.pix01366c27f152-2f13-4edb-89fa-54e3b7fdb47e5204000053039865802BR5914KAIQUE L SILVA6007TAUBATE62070503***6304A1D2";

// Data e hora da cerimônia — horário de Brasília (UTC−3)
const CERIMONIA = new Date("2027-01-09T15:00:00-03:00").getTime();


// =========================================================
// Relógio: dias, horas, minutos e segundos até a cerimônia
// =========================================================
const relogio = document.getElementById("relogio");
const campo = {
  d: document.getElementById("rel-d"),
  h: document.getElementById("rel-h"),
  m: document.getElementById("rel-m"),
  s: document.getElementById("rel-s"),
};
const doisDigitos = (n) => String(n).padStart(2, "0");

function atualizarRelogio() {
  const falta = Math.floor((CERIMONIA - Date.now()) / 1000);

  if (falta <= 0) {
    // no dia do casamento mostra a mensagem; depois o relógio some
    if (falta > -86400) {
      relogio.innerHTML = '<p class="relogio-titulo">Chegou o grande dia!</p>';
    } else {
      relogio.hidden = true;
    }
    clearInterval(timer);
    return;
  }

  campo.d.textContent = Math.floor(falta / 86400);
  campo.h.textContent = doisDigitos(Math.floor((falta % 86400) / 3600));
  campo.m.textContent = doisDigitos(Math.floor((falta % 3600) / 60));
  campo.s.textContent = doisDigitos(falta % 60);
}

const timer = setInterval(atualizarRelogio, 1000);
atualizarRelogio();


// =========================================================
// Janela "Presentear os noivos"
// =========================================================
const janela = document.getElementById("janela-presentes");
const passoEscolha = document.getElementById("passo-escolha");
const passoPix = document.getElementById("passo-pix");
const avisoPix = document.getElementById("aviso-pix");

document.getElementById("opcao-lista").href = LINK_LISTA;

function mostrarPasso(passo) {
  passoEscolha.hidden = passo !== "escolha";
  passoPix.hidden = passo !== "pix";
  avisoPix.textContent = "";
}

document.getElementById("presentear").addEventListener("click", () => {
  mostrarPasso("escolha");
  janela.showModal();
});

document.getElementById("opcao-pix").addEventListener("click", () => {
  mostrarPasso("pix");
  document.getElementById("copiar-pix").focus();
});

document.getElementById("voltar").addEventListener("click", () => {
  mostrarPasso("escolha");
  document.getElementById("opcao-pix").focus();
});

// fecha no "×" ou clicando fora da janela
janela.querySelector("[data-fechar]").addEventListener("click", () => janela.close());
janela.addEventListener("click", (e) => {
  if (e.target === janela) janela.close();
});

document.getElementById("copiar-pix").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(PIX_COPIA_E_COLA);
    avisoPix.textContent = "Código copiado! Agora é só colar no app do banco.";
  } catch {
    // navegadores que bloqueiam a área de transferência: mostra o código para copiar à mão
    avisoPix.textContent = PIX_COPIA_E_COLA;
    avisoPix.classList.add("codigo");
  }
});
