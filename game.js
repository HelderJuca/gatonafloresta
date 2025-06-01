const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    backgroundColor: '#e2ffd9',
    parent: 'jogo',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let gatoAtual = 0;
let gatoSprite;
let tempoAnimacao = 0;

let pulando = false;
let velocidadeY = 0;
let gravidadeBase = 0.8;
let gravidade = gravidadeBase;
const ALTURA_PULO = -18;
const CHAO_Y = 300;

let troncoSprite;
const velocidadeTroncoBase = 7;
let velocidadeTronco = velocidadeTroncoBase;

let emJogo = true;
let textoGameOver;

let metros = 0;
let bonus = 0;
let velocidadeJogo = 1.0;

const tempoFrameBase = 90;
let tempoFrame = tempoFrameBase;

let podium = [
    { nome: '---', pontos: 0 },
    { nome: '---', pontos: 0 },
    { nome: '---', pontos: 0 },
    { nome: '---', pontos: 0 },
    { nome: '---', pontos: 0 },
    { nome: '---', pontos: 0 },
    { nome: '---', pontos: 0 },
    { nome: '---', pontos: 0 }
];

let nomeJogador = '';
let inputAtivo = false;

function preload() {
    for (let i = 1; i <= 6; i++) {
        this.load.image('gato' + i, `gato${i}.png`);
    }
    this.load.image('gatonoar', 'gatonoar.png');
    this.load.image('tronco', 'tronco.png');
}

function create() {
    carregarPodium();

    gatoAtual = 0;
    pulando = false;
    velocidadeY = 0;
    metros = 0;
    bonus = 0;
    emJogo = true;
    velocidadeJogo = 1.0;
    tempoFrame = tempoFrameBase;
    gravidade = gravidadeBase;
    velocidadeTronco = velocidadeTroncoBase;
    nomeJogador = '';
    inputAtivo = false;

    gatoSprite = this.add.sprite(100, CHAO_Y, 'gato1').setScale(0.7);

    this.input.keyboard.on('keydown-SPACE', () => {
        if (emJogo) pular();
    }, this);
    this.input.keyboard.on('keydown-UP', () => {
        if (emJogo) pular();
    }, this);

    this.input.keyboard.on('keydown', (event) => {
        if (inputAtivo) {
            if (event.key === 'Enter') {
                finalizarNome.call(this);
            } else if (event.key === 'Backspace') {
                nomeJogador = nomeJogador.slice(0, -1);
                atualizarSidebarNome();
            } else if (/^[a-zA-Z0-9 ]$/.test(event.key) && nomeJogador.length < 12) {
                nomeJogador += event.key;
                atualizarSidebarNome();
            }
        }
    }, this);

    // BOTÃO FLUTUANTE (clique ou toque)
    const botao = document.getElementById('botao-pulo');
    botao.addEventListener('click', () => {
        if (emJogo) pular();
    });
    botao.addEventListener('touchstart', () => {
        if (emJogo) pular();
    });

    troncoSprite = this.add.sprite(900, CHAO_Y + 25, 'tronco').setScale(1);

    textoGameOver = this.add.text(400, 160, '', {
        font: 'bold 42px Arial, Verdana, sans-serif',
        fill: '#f44',
        align: 'center'
    }).setOrigin(0.5);

    atualizarSidebarHUD();
    atualizarSidebarPodium();
    atualizarSidebarNome();
}

function update(time, delta) {
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

        // Aumenta dificuldade em +1%
        velocidadeJogo *= 1.01;
        velocidadeTronco = velocidadeTroncoBase * velocidadeJogo;
        tempoFrame = tempoFrameBase / velocidadeJogo;
        gravidade = gravidadeBase * velocidadeJogo;
    }

    metros += velocidadeTronco * 0.15;
    atualizarSidebarHUD();

    if (checaColisao(gatoSprite, troncoSprite, 0.7, 0.5)) {
        gameOver.call(this);
    }
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

    let larguraA = a.width * fatorA;
    let alturaA = a.height * fatorA;
    let aBox = new Phaser.Geom.Rectangle(
        a.centerX - larguraA / 2,
        a.centerY - alturaA / 2,
        larguraA,
        alturaA
    );

    let larguraB = b.width * fatorB;
    let alturaB = b.height * fatorB;
    let bBox = new Phaser.Geom.Rectangle(
        b.centerX - larguraB / 2,
        b.centerY - alturaB / 2,
        larguraB,
        alturaB
    );

    return Phaser.Geom.Intersects.RectangleToRectangle(aBox, bBox);
}

function gameOver() {
    emJogo = false;
    textoGameOver.setText('Game Over!');
    inputAtivo = true;
    nomeJogador = '';
    atualizarSidebarNome();
}

function finalizarNome() {
    inputAtivo = false;
    textoGameOver.setText('Salvando...');
    let nomeFinal = nomeJogador.trim() || '???';
    let total = Math.floor(metros) + bonus;

    podium.push({ nome: nomeFinal.slice(0, 12), pontos: total });
    podium.sort((a, b) => b.pontos - a.pontos);
    podium = podium.slice(0, 8);

    salvarPodium();
    atualizarSidebarPodium();

    setTimeout(() => {
        this.scene.restart();
    }, 1200);
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
        if (i < 3) {
            li.innerText = `${medalhas[i]} ${podium[i].nome} - ${podium[i].pontos} pts`;
        } else {
            li.innerText = `${i + 1}º ${podium[i].nome} - ${podium[i].pontos} pts`;
        }
        list.appendChild(li);
    }
}

function atualizarSidebarNome() {
    const sidebar = document.getElementById('sidebar');
    let p = document.getElementById('inputNome');
    if (!p) {
        p = document.createElement('p');
        p.id = 'inputNome';
        p.style.marginTop = '10px';
        p.style.fontWeight = 'bold';
        p.style.fontSize = '0.9em';
        sidebar.appendChild(p);
    }

    if (inputAtivo) {
        p.innerText = `Digite seu nome: ${nomeJogador}`;
    } else {
        p.innerText = '';
    }
}

function salvarPodium() {
    localStorage.setItem('podiumGatinho', JSON.stringify(podium));
}

function carregarPodium() {
    const salvo = localStorage.getItem('podiumGatinho');
    if (salvo) {
        try {
            const arr = JSON.parse(salvo);
            if (Array.isArray(arr) && arr.length === 8) {
                podium = arr;
            }
        } catch (e) {}
    }
}
