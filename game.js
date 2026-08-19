const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'START_MENU'; // START_MENU, GYM_MENU, TRAIN_MOUSE, TRAIN_KEYBOARD
let playerCharacter = null;
let playerEnergy = 100;
let playerCoins = 0;

// UI 요소
const uiLayer = document.getElementById('ui-layer');
const missionUi = document.getElementById('mission-ui');
const charButtons = document.querySelectorAll('.char-btn[data-char]');

const btnMouse = document.getElementById('btn-mouse');
const btnKeyboard = document.getElementById('btn-keyboard');
const btnGymExit = document.getElementById('btn-gym-exit');

// 마우스 미션용 변수
let targetBubble = { x: 400, y: 300, radius: 40, active: false };

// 키보드 미션용 변수
const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let targetKey = "";

// --- 이벤트 리스너 ---

// 1. 캐릭터 선택
charButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        playerCharacter = e.target.getAttribute('data-char');
        uiLayer.style.display = 'none';
        showGymMenu();
    });
});

// 체육관 메뉴 보이기 함수
function showGymMenu() {
    gameState = 'GYM_MENU';
    missionUi.style.display = 'flex';
}

// 2. 마우스 훈련 시작
btnMouse.addEventListener('click', () => {
    gameState = 'TRAIN_MOUSE';
    missionUi.style.display = 'none';
    spawnBubble();
});

// 3. 키보드 훈련 시작
btnKeyboard.addEventListener('click', () => {
    gameState = 'TRAIN_KEYBOARD';
    missionUi.style.display = 'none';
    spawnKey();
});

// 키보드 입력 처리
window.addEventListener('keydown', (e) => {
    // 훈련 중 뒤로가기 (ESC)
    if (e.code === 'Escape' && (gameState === 'TRAIN_MOUSE' || gameState === 'TRAIN_KEYBOARD')) {
        showGymMenu();
        return;
    }

    // 키보드 훈련 로직
    if (gameState === 'TRAIN_KEYBOARD') {
        // 누른 키가 타겟 키와 일치하는지 확인 (대소문자 구분 없이)
        if (e.key.toUpperCase() === targetKey) {
            playerCoins++;
            spawnKey(); // 정답이면 새 글자 등장
        }
    }
});

// 마우스 클릭 처리
canvas.addEventListener('mousedown', (e) => {
    if (gameState === 'TRAIN_MOUSE' && targetBubble.active) {
        // 캔버스 내에서의 마우스 좌표 계산
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 마우스 클릭이 버블 안에 있는지 계산 (피타고라스 정리)
        const dx = mouseX - targetBubble.x;
        const dy = mouseY - targetBubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= targetBubble.radius) {
            // 명중!
            playerCoins++;
            spawnBubble(); // 새 버블 등장
        }
    }
});

// --- 훈련 도우미 함수 ---

function spawnBubble() {
    targetBubble.active = true;
    targetBubble.radius = 40;
    // 캔버스 밖으로 나가지 않게 랜덤 좌표 생성
    targetBubble.x = Math.random() * (canvas.width - 100) + 50;
    targetBubble.y = Math.random() * (canvas.height - 200) + 100;
}

function spawnKey() {
    // 랜덤 알파벳 하나 뽑기
    const randomIndex = Math.floor(Math.random() * alphabets.length);
    targetKey = alphabets[randomIndex];
}

// --- 게임 루프 ---

function update() {
    // 마우스 버블 크기가 커졌다 작아졌다 하는 애니메이션 효과 (숨쉬는 느낌)
    if (gameState === 'TRAIN_MOUSE' && targetBubble.active) {
        // 단순 애니메이션을 위해 radius를 고정해두었음 (추후 애니메이션 추가 가능)
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 상태창 그리기 (모든 화면 공통)
    if (gameState !== 'START_MENU') {
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        ctx.font = "bold 24px Arial";
        ctx.fillText("❤️ 체력: " + playerEnergy, 20, 40);
        ctx.fillText("💰 코인: " + playerCoins, 20, 70);
    }

    if (gameState === 'GYM_MENU') {
        // HTML UI가 덮고 있으므로 캔버스에는 배경만 그림
        ctx.fillStyle = "#FFDAB9";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } 
    else if (gameState === 'TRAIN_MOUSE') {
        // 배경
        ctx.fillStyle = "#E0FFFF"; // 연한 민트색
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 안내문
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.font = "20px Arial";
        ctx.fillText("🎈 나타나는 물방울을 마우스로 정확히 클릭하세요! (그만하려면 ESC키)", canvas.width / 2, 40);

        // 버블 그리기
        if (targetBubble.active) {
            ctx.beginPath();
            ctx.arc(targetBubble.x, targetBubble.y, targetBubble.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(135, 206, 235, 0.8)";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "blue";
            ctx.stroke();
            
            // 물방울 안에 귀여운 표정
            ctx.fillStyle = "black";
            ctx.font = "20px Arial";
            ctx.fillText("💦", targetBubble.x, targetBubble.y + 7);
        }
    }
    else if (gameState === 'TRAIN_KEYBOARD') {
        // 배경
        ctx.fillStyle = "#FFF0F5"; // 연한 분홍색
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 안내문
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.font = "20px Arial";
        ctx.fillText("⌨️ 화면에 나오는 알파벳을 키보드에서 찾아 누르세요! (그만하려면 ESC키)", canvas.width / 2, 40);

        // 타겟 글자 그리기
        ctx.fillStyle = "#FF4500";
        ctx.font = "bold 150px Arial";
        ctx.fillText(targetKey, canvas.width / 2, canvas.height / 2 + 30);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 시작
gameLoop();
