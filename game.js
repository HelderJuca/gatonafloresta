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
let textoGameOver, textoInputNome, pontuacaoCentroTexto;

let metros = 0, bonus = 0, velocidadeJogo = 1.0;
let podium = Array(8).fill({ nome: '---', pontos: 0 });
let nomeJogador = '', inputAtivo = false;

function startGame() {
    document.getElementById('iniciar-jogo').classList.add('hidden');
    game = new Phaser.Game(config);
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

    textoGameOver = this.add.text(400, 140, '', {
        font: 'bold 42px Arial',
        fill: '#f44'
    }).setOrigin(0.5);

    textoInputNome = this.add.text(400, 200, '', {
        font: 'bold 28px Arial',
        fill: '#333'
    }).setOrigin(0.5);

    pontuacaoCentroTexto = this.add.text(400, 50, '', {
        font: 'bold 36px Arial',
        fill: '#333'
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-SPACE', () => { if (emJogo) pular(); });
    this.input.keyboard.on('keydown-UP', () => { if (emJogo) pular(); });

    this.input.keyboard.on('keydown', (event) => {
        if (!inputAtivo) return;
        if (event.key === 'Enter') finalizarNome.call(this);
        else if (event.key === 'Backspace') nomeJogador = nomeJogador.slice(0, -1);
        else if (/^[a-zA-Z0-9 ]$/.test(event.key) && nomeJogador.length < 12)
            nomeJogador += event.key;

        textoInputNome.setText(`Digite seu nome: ${nomeJogador}`);
    });

    const botao = document.getElementById('botao-pulo');
    botao.addEventListener('click', () => { if (emJogo) pular(); });
    botao.addEventListener('touchstart', () => { if (emJogo) pular(); });

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
    inputAtivo = false;
    troncoSprite.x = 900;
    emJogo = true;

    textoGameOver.setText('');
    textoInputNome.setText('');
    pontuacaoCentroTexto.setText('');

    atualizarSidebarHUD();
    atualizarSidebarPodium();
}

function update(time, delta) {
    if (!emJogo) return;

    // Animação
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

    // Pulo
    if (pulando) {
        gatoSprite.y += velocidadeY;
        velocidadeY += gravidade;
        if (gatoSprite.y >= CHAO_Y) {
            gatoSprite.y = CHAO_Y;
            pulando = false;
            velocidadeY = 0;
        }
    }

    // Tronco
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

    if (checaColisao(gatoSprite, troncoSprite, 0.7, 0.5)) gameOver.call(this);
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
    textoGameOver.setText('Game Over!');
    textoInputNome.setText('Digite seu nome: ');
    pontuacaoCentroTexto.setText('');
    nomeJogador = '';
    inputAtivo = true;
}

function finalizarNome() {
    inputAtivo = false;
    textoGameOver.setText('Salvando...');
    textoInputNome.setText('');

    const nomeFinal = nomeJogador.trim() || '???';
    const total = Math.floor(metros) + bonus;
    podium.push({ nome: nomeFinal.slice(0, 12), pontos: total });
    podium.sort((a, b) => b.pontos - a.pontos);
    podium = podium.slice(0, 8);

    salvarPodium();
    atualizarSidebarPodium();

    document.getElementById('iniciar-jogo').classList.remove('hidden');

    this.scene.pause();
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
        const li = document.createElement('li');
        const jogador = podium[i];
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
});
