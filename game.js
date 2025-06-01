let game;
let config = {
  type: Phaser.AUTO,
  width: 800,
  height: 400,
  backgroundColor: '#e2ffd9',
  parent: 'jogo',
  scene: { preload, create, update }
};

let gatoSprite, troncoSprite;
let gatoAtual = 0, tempoAnimacao = 0;
let tempoFrameBase = 90, tempoFrame = tempoFrameBase;
let pulando = false, velocidadeY = 0;
let gravidadeBase = 0.8, gravidade = gravidadeBase;
const ALTURA_PULO = -18, CHAO_Y = 300;

let velocidadeTroncoBase = 7, velocidadeTronco = velocidadeTroncoBase;
let emJogo = false;
let textoGameOver, pontuacaoCentroTexto;

let metros = 0, bonus = 0, velocidadeJogo = 1.0;
let podium = Array(8).fill({ nome: '---', pontos: 0 });
let nomeJogador = '';

function startGame() {
  const input = document.getElementById('entrada-nome');
  document.getElementById('iniciar-jogo').classList.add('hidden');
  input.classList.add('oculto');
  input.value = '';

  if (!game) {
    game = new Phaser.Game(config);
  } else {
    game.scene.scenes[0].scene.restart();
  }
}

function preload() {
  for (let i = 1; i <= 6; i++) this.load.image('gato' + i, `gato${i}.png`);
  this.load.image('gatonoar', 'gatonoar.png');
  this.load.image('tronco', 'tronco.png');
}

function create() {
  carregarPodium();

  gatoSprite = this.add.sprite(100, CHAO_Y, 'gato1').setScale(0.7);
  troncoSprite = this.add.sprite(900, CHAO_Y + 25, 'tronco').setScale(1);

  textoGameOver = this.add.text(400, 60, '', {
    font: 'bold 32px Fredoka',
    fill: '#f44'
  }).setOrigin(0.5);

  pontuacaoCentroTexto = this.add.text(400, 50, '', {
    font: 'bold 36px Fredoka',
    fill: '#333'
  }).setOrigin(0.5);

  this.input.keyboard.on('keydown-SPACE', () => { if (emJogo) pular(); });
  this.input.keyboard.on('keydown-UP', () => { if (emJogo) pular(); });

  document.getElementById('entrada-nome').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') finalizarNome();
  });

  document.getElementById('botao-pulo').addEventListener('click', () => { if (emJogo) pular(); });
  document.getElementById('botao-pulo').addEventListener('touchstart', () => { if (emJogo) pular(); });

  reiniciarJogo();
}

function reiniciarJogo() {
  gatoAtual = 0;
  pulando = false;
  velocidadeY = 0;
  metros = 0;
  bonus = 0;
  velocidadeJogo = 1.0;
  tempoFrame = tempoFrameBase;
  gravidade = gravidadeBase;
  velocidadeTronco = velocidadeTroncoBase;
  nomeJogador = '';
  troncoSprite.x = 900 + Math.random() * 200;
  emJogo = true;

  textoGameOver.setText('');
  pontuacaoCentroTexto.setText('');

  atualizarSidebarHUD();
  atualizarSidebarPodium();
}

function update(_, delta) {
  if (!emJogo) return;

  if (!pulando) {
    tempoAnimacao += delta;
    if (tempoAnimacao > tempoFrame) {
      gatoAtual = (gatoAtual + 1) % 6;
      gatoSprite.setTexture('gato' + (gatoAtual + 1));
      tempoAnimacao = 0;
    }
  } else {
    gatoSprite.setTexture('gatonoar');
  }

  if (pulando) {
    gatoSprite.y += velocidadeY;
    velocidadeY += gravidade;
    if (gatoSprite.y >= CHAO_Y) {
      gatoSprite.y = CHAO_Y;
      pulando = false;
      velocidadeY = 0;
    }
  }

  troncoSprite.x -= velocidadeTronco;
  if (troncoSprite.x < -50) {
    troncoSprite.x = 900 + Math.random() * 200;
    bonus += 10;
    velocidadeJogo *= 1.01;
    velocidadeTronco = velocidadeTroncoBase * velocidadeJogo;
    tempoFrame = tempoFrameBase / velocidadeJogo;
    gravidade = gravidadeBase * velocidadeJogo;
  }

  metros += velocidadeTronco * 0.15;
  atualizarSidebarHUD();
  pontuacaoCentroTexto.setText(`${Math.floor(metros) + bonus} pts`);

  if (checaColisao(gatoSprite, troncoSprite, 0.7, 0.5)) gameOver();
}

function pular() {
  if (!pulando) {
    pulando = true;
    velocidadeY = ALTURA_PULO;
  }
}

function checaColisao(spriteA, spriteB, fatorA = 0.7, fatorB = 0.5) {
  let a = spriteA.getBounds();
  let b = spriteB.getBounds();
  let aBox = new Phaser.Geom.Rectangle(
    a.centerX - a.width * fatorA / 2,
    a.centerY - a.height * fatorA / 2,
    a.width * fatorA,
    a.height * fatorA
  );
  let bBox = new Phaser.Geom.Rectangle(
    b.centerX - b.width * fatorB / 2,
    b.centerY - b.height * fatorB / 2,
    b.width * fatorB,
    b.height * fatorB
  );
  return Phaser.Geom.Intersects.RectangleToRectangle(aBox, bBox);
}

function gameOver() {
  emJogo = false;

  const total = Math.floor(metros) + bonus;
  let colocacao = 9;
  let novaEntrada = { nome: '???', pontos: total };

  let candidatos = [...podium, novaEntrada];
  candidatos.sort((a, b) => b.pontos - a.pontos);
  colocacao = candidatos.findIndex(j => j.pontos === total) + 1;

  // Mensagem personalizada:
  let mensagemFinal = '';
  if (colocacao === 1) {
    mensagemFinal = `🥇🥇🥇 Uhuuu!!! É OUROOOO!!! ${total} pts. Medalha de OURO! 🥇🥇🥇`;
  } else if (colocacao === 2) {
    mensagemFinal = `Uau! Parabéns medalhista! ${total} pts. Medalha de PRATA!`;
  } else if (colocacao === 3) {
    mensagemFinal = `Uau! Parabéns medalhista! ${total} pts. Medalha de BRONZE!`;
  } else if (colocacao >= 4 && colocacao <= 8) {
    mensagemFinal = `Parabéns! ${total} pts. ${colocacao}º lugar!`;
  } else {
    mensagemFinal = `${total} pts. Não entrou no ranking.`;
  }

  textoGameOver.setText(mensagemFinal);
  pontuacaoCentroTexto.setText('');

  // Medalha animada se top 3
  if (colocacao <= 3) {
    const medalhas = ['🥇', '🥈', '🥉'];
    const emoji = medalhas[colocacao - 1];
    const medalhaText = game.scene.scenes[0].add.text(400, 260, emoji, {
      font: '64px Arial',
      color: '#f90'
    }).setOrigin(0.5).setScale(0).setAlpha(0.8);

    game.scene.scenes[0].tweens.add({
      targets: medalhaText,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Bounce',
      yoyo: true,
      hold: 1000,
      onComplete: () => medalhaText.destroy()
    });
  }

  if (colocacao <= 8) {
    const input = document.getElementById('entrada-nome');
    input.classList.remove('oculto');
    input.focus();
  } else {
    document.getElementById('iniciar-jogo').classList.remove('hidden');
  }
}



function finalizarNome() {
  const input = document.getElementById('entrada-nome');
  nomeJogador = input.value.trim() || '???';
  input.value = '';
  input.classList.add('oculto');

  const total = Math.floor(metros) + bonus;
  podium.push({ nome: nomeJogador.slice(0, 12), pontos: total });
  podium.sort((a, b) => b.pontos - a.pontos);
  podium = podium.slice(0, 8);

  salvarPodium();
  atualizarSidebarPodium();

  document.getElementById('iniciar-jogo').classList.remove('hidden');
}


function atualizarSidebarHUD() {
  document.getElementById('distance').innerText = `${Math.floor(metros)} m`;
  document.getElementById('bonus').innerText = `${bonus} pts`;
  document.getElementById('total').innerText = `${Math.floor(metros) + bonus} pts`;
}

function atualizarSidebarPodium() {
  const list = document.getElementById('top8');
  list.innerHTML = '';
  const medalhas = ['🥇', '🥈', '🥉'];
  for (let i = 0; i < 8; i++) {
    const jogador = podium[i];
    const li = document.createElement('li');
    if (i < 3) {
      li.innerText = `${medalhas[i]} ${jogador.nome} - ${jogador.pontos} pts`;
    } else {
      li.innerText = `${jogador.nome} - ${jogador.pontos} pts`;
    }
    list.appendChild(li);
  }
}

function salvarPodium() {
  localStorage.setItem('podiumGatinho', JSON.stringify(podium));
}

function carregarPodium() {
  let salvo = localStorage.getItem('podiumGatinho');
  if (salvo) {
    try {
      let arr = JSON.parse(salvo);
      if (Array.isArray(arr) && arr.length === 8) podium = arr;
    } catch (e) {}
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('iniciar-jogo').addEventListener('click', startGame);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !emJogo) {
      const botao = document.getElementById('iniciar-jogo');
      if (!botao.classList.contains('hidden')) {
        startGame();
      }
    }
  });
});
