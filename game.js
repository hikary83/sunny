// 캔버스와 그리기 도구 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 상태 변수
let gameState = 'START_MENU'; // START_MENU, MISSION, SWIMMING, GAME_OVER
let playerCharacter = null;
let playerEnergy = 100;
let playerCoins = 0;

// 미션용 변수 (스페이스바 연타)
let spaceCount = 0;
let charYOffset = 0; // 캐릭터가 점프(운동)하는 모션을 위한 변수

// UI 요소 가져오기
const uiLayer = document.getElementById('ui-layer');
const charButtons = document.querySelectorAll('.char-btn');

// 캐릭터 선택 이벤트 달기
charButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        playerCharacter = e.target.getAttribute('data-char');
        uiLayer.style.display = 'none';
        gameState = 'MISSION';
    });
});

// 키보드 입력 이벤트 (스페이스바 연타)
window.addEventListener('keydown', (e) => {
    if (gameState === 'MISSION' && e.code === 'Space') {
        spaceCount++;
        charYOffset = -30; // 스페이스바 누를 때마다 위로 펄쩍! (운동하는 모습)
        
        // 10번 누를 때마다 코인 1개 획득!
        if (spaceCount >= 10) {
            playerCoins++;
            spaceCount = 0; // 카운트 초기화
        }
    }
});

function update() {
    if (gameState !== 'MISSION') return;
    
    // 캐릭터가 위로 펄쩍 뛰었다가 다시 아래로 자연스럽게 내려오도록(중력 효과)
    if (charYOffset < 0) {
        charYOffset += 2; // 매 프레임마다 조금씩 아래로 내려옴
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'MISSION') {
        // 체육관 배경색
        ctx.fillStyle = "#FFDAB9";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 주인공 캐릭터(이모지) 그리기 (Y축에 charYOffset을 더해서 펄쩍펄쩍 뛰게 만듦)
        ctx.font = "100px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(playerCharacter, canvas.width / 2, canvas.height / 2 + charYOffset);
        
        // 안내 문구 및 상태
        ctx.fillStyle = "black";
        ctx.font = "bold 30px Arial";
        ctx.fillText("💦 열심히 운동해서 코인을 벌자! 💦", canvas.width / 2, canvas.height / 2 - 150);
        
        ctx.font = "20px Arial";
        ctx.fillText("미션: 스페이스바를 10번 연타하면 1코인 획득!", canvas.width / 2, canvas.height / 2 + 120);
        
        // 운동 카운트 게이지 바처럼 표시
        ctx.fillText("현재 스페이스바 누른 횟수: " + spaceCount + " / 10", canvas.width / 2, canvas.height / 2 + 160);
        
        // 좌측 상단 상태창 (체력, 코인)
        ctx.textAlign = "left";
        ctx.font = "bold 24px Arial";
        ctx.fillText("❤️ 체력: " + playerEnergy, 20, 40);
        ctx.fillText("💰 코인: " + playerCoins, 20, 70);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 게임 시작
gameLoop();
