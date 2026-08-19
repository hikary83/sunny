// 캔버스와 그리기 도구(context) 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 진행 상태를 나타내는 변수들
let isGameOver = false;

// 게임 상태를 업데이트하는 함수 (캐릭터 이동, 충돌 계산 등)
function update() {
    if (isGameOver) return;
    
    // TODO: 여기에 스토리에 맞는 로직 추가!
}

// 화면에 그림을 그리는 함수
function draw() {
    // 1. 화면 깨끗하게 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. 글자 쓰기 (테스트용)
    ctx.fillStyle = "black";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("D드라이브에 프로젝트 세팅 완료!", canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = "20px Arial";
    ctx.fillText("준비해오신 스토리를 들려주세요! 🤩", canvas.width / 2, canvas.height / 2 + 30);
}

// 게임이 계속해서 돌아가게 만드는 루프 함수 (1초에 약 60번 실행됨)
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 게임 시작!
gameLoop();
