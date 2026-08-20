const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 게임 상태 정의 ---
let gameState = 'START_MENU'; 

let playerCharacter = null;
let playerEnergy = 100;
let playerCoins = 0;

// --- 상점 장비 상태 ---
let hasFins = false;     // 오리발 (속도 증가)
let hasGoggles = false;  // 물안경 (데미지 반감)
let playerDir = 'up';    // 캐릭터 수영 방향 (up, down, left, right)

// --- 이미지 에셋 로더 ---
const images = {};
let isAssetsLoaded = false;
let imagesLoadedCount = 0;

const imageSources = {
    // 배경 이미지
    bgGym: 'assets/bg_gym.png',
    bgWater: 'assets/bg_water.png',
    bgValley: 'assets/bg_valley.png',
    bgOcean: 'assets/bg_ocean.png',
    
    // 장애물 이미지
    obsLifebuoy: 'assets/obs_lifebuoy.png',
    obsBeachball: 'assets/obs_beachball.png',
    obsLog: 'assets/obs_log.png',
    obsCrab: 'assets/obs_crab.png',
    obsShark: 'assets/obs_shark.png',
    
    // 상점 아이템 이미지
    itemDrink: 'assets/item_drink.png',
    itemFins: 'assets/item_fins.png',
    itemGoggles: 'assets/item_goggles.png'
};

// 다중 캐릭터 4방향 수영 이미지 로드
const characters = {
    '👽': { prefix: 'stitch', dirs: ['up', 'down', 'left', 'right'] },
    '🐶': { prefix: 'dog', dirs: ['up', 'down', 'left', 'right'] },
    '🦖': { prefix: 'dino', dirs: ['up', 'down', 'left', 'right'] },
    '🐧': { prefix: 'penguin', dirs: ['up', 'down', 'left', 'right'] }
};

for (let charKey in characters) {
    const charInfo = characters[charKey];
    charInfo.dirs.forEach(d => {
        const imgKey = "char_" + charInfo.prefix + "_" + d;
        imageSources[imgKey] = "assets/player_" + charInfo.prefix + "_" + d + ".png";
    });
}

const totalImages = Object.keys(imageSources).length;

for (let key in imageSources) {
    images[key] = new Image();
    images[key].src = imageSources[key];
    images[key].onload = () => {
        imagesLoadedCount++;
        if (imagesLoadedCount === totalImages) {
            isAssetsLoaded = true;
            console.log("All game assets loaded successfully.");
        }
    };
    images[key].onerror = () => {
        imagesLoadedCount++;
        if (imagesLoadedCount === totalImages) {
            isAssetsLoaded = true;
        }
    };
}

// --- UI 요소 선택 ---
const uiLayer = document.getElementById('ui-layer');
const missionUi = document.getElementById('mission-ui');
const hubUi = document.getElementById('hub-ui');
const difficultyUi = document.getElementById('difficulty-ui');
const shopUi = document.getElementById('shop-ui');
const shopCoinsText = document.getElementById('shop-coins');
const keyboardPad = document.getElementById('keyboard-pad');
const virtualKeyButtons = document.querySelectorAll('.key-btn:not(#btn-key-esc)');
const btnKeyEsc = document.getElementById('btn-key-esc');

const charButtons = document.querySelectorAll('.char-btn[data-char]');
const btnMouse = document.getElementById('btn-mouse');
const btnKeyboard = document.getElementById('btn-keyboard');
const btnGymExit = document.getElementById('btn-gym-exit');

// 허브 버튼들
const btnGoSwim = document.getElementById('btn-go-swim');
const btnGoGym = document.getElementById('btn-go-gym');
const btnGoShop = document.getElementById('btn-go-shop');

// 난이도 및 상점 조작 버튼들
const diffButtons = document.querySelectorAll('.diff-btn[data-diff]');
const btnDiffBack = document.getElementById('btn-diff-back');
const btnShopBack = document.getElementById('btn-shop-back');

const buyDrinkBtn = document.getElementById('buy-drink');
const buyFinsBtn = document.getElementById('buy-fins');
const buyGogglesBtn = document.getElementById('buy-goggles');

// --- 미션 관련 변수 ---
let targetBubble = { x: 225, y: 400, radius: 40, active: false };
const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let targetKey = "";

// --- 수영 플레이 관련 변수 (세로형 종스크롤 전환) ---
let playerX = 225; // 450의 중앙
let playerY = 680; // 화면 아래쪽에 소환
const playerRadius = 25; 
let swimDistance = 0;
const targetDistance = 1500; 
let obstacles = [];
let obstacleSpawnTimer = 0;
let currentDifficulty = 'easy'; 
let laneOffset = 0; // 위에서 아래로 흐르는 맵 배경용 오프셋

// 무적 관련
let isInvulnerable = false;
let invulnerableTimer = 0;

// 결과 메시지 연출
let showSwimResult = false;
let swimResultMsg = "";
let swimResultTimer = 0;

// 입력 키 트래킹
let keys = {};

// --- 이벤트 리스너 설정 ---

// 1. 캐릭터 선택 및 게임 시작
charButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        playerCharacter = button.getAttribute('data-char');
        uiLayer.style.display = 'none';
        showHubMenu();
    });
});

// 2. 허브 메뉴 전환
btnGoSwim.addEventListener('click', () => {
    if (playerEnergy < 10) {
        alert("체력이 부족합니다! 체육관에서 훈련하여 충전하거나 상점에서 드링크를 드세요!");
        return;
    }
    showDifficultyMenu();
});
btnGoGym.addEventListener('click', showGymMenu);
btnGoShop.addEventListener('click', showShopMenu);

// 3. 체육관 메뉴 조작
btnMouse.addEventListener('click', () => {
    gameState = 'TRAIN_MOUSE';
    missionUi.style.display = 'none';
    spawnBubble();
});

btnKeyboard.addEventListener('click', () => {
    gameState = 'TRAIN_KEYBOARD';
    missionUi.style.display = 'none';
    keyboardPad.style.display = 'flex'; // 가상 키보드 표시
    spawnKey();
});

btnGymExit.addEventListener('click', showHubMenu);

// 가상 키보드 문자 버튼 클릭 이벤트 (모바일)
virtualKeyButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (gameState === 'TRAIN_KEYBOARD') {
            const keyVal = button.innerText.trim().toUpperCase();
            if (keyVal === targetKey) {
                playerCoins++;
                playerEnergy = Math.min(100, playerEnergy + 3);
                spawnKey();
            }
        }
    });
});

// 가상 키보드 ESC 버튼 클릭 이벤트 (모바일)
btnKeyEsc.addEventListener('click', () => {
    if (gameState === 'TRAIN_KEYBOARD') {
        showGymMenu();
    }
});

// 4. 난이도 선택 조작
diffButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        currentDifficulty = e.currentTarget.getAttribute('data-diff');
        difficultyUi.style.display = 'none';
        startSwimming();
    });
});
btnDiffBack.addEventListener('click', showHubMenu);

// 5. 상점 조작 및 구매
btnShopBack.addEventListener('click', showHubMenu);

buyDrinkBtn.addEventListener('click', () => {
    if (playerCoins >= 10 && playerEnergy < 100) {
        playerCoins -= 10;
        playerEnergy = Math.min(100, playerEnergy + 50);
        updateShopUI();
    } else if (playerEnergy >= 100) {
        alert("이미 체력이 가득 차 있습니다!");
    } else {
        alert("코인이 부족합니다!");
    }
});

buyFinsBtn.addEventListener('click', () => {
    if (playerCoins >= 30 && !hasFins) {
        playerCoins -= 30;
        hasFins = true;
        updateShopUI();
    } else if (hasFins) {
        alert("이미 오리발을 보유하고 있습니다!");
    } else {
        alert("코인이 부족합니다!");
    }
});

buyGogglesBtn.addEventListener('click', () => {
    if (playerCoins >= 25 && !hasGoggles) {
        playerCoins -= 25;
        hasGoggles = true;
        updateShopUI();
    } else if (hasGoggles) {
        alert("이미 물안경을 보유하고 있습니다!");
    } else {
        alert("코인이 부족합니다!");
    }
});

// 키보드 이벤트 트래킹 (수영용)
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    if (e.code === 'Escape') {
        if (gameState === 'TRAIN_MOUSE' || gameState === 'TRAIN_KEYBOARD') {
            showGymMenu();
            return;
        } else if (gameState === 'SWIMMING_POOL') {
            showHubMenu();
            return;
        }
    }

    // 키보드 훈련 로직
    if (gameState === 'TRAIN_KEYBOARD') {
        if (e.key.toUpperCase() === targetKey) {
            playerCoins++;
            playerEnergy = Math.min(100, playerEnergy + 3); 
            spawnKey();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// --- 모바일 터치 및 드래그 조작 변수 ---
let isDraggingPlayer = false;
let lastDragX = 0;
let lastDragY = 0;

function handleStart(x, y) {
    if (gameState === 'SWIMMING_POOL' && !showSwimResult) {
        isDraggingPlayer = true;
        lastDragX = x;
        lastDragY = y;
    }
}

function handleMove(x, y) {
    if (gameState === 'SWIMMING_POOL' && !showSwimResult && isDraggingPlayer) {
        const dx = x - lastDragX;
        const dy = y - lastDragY;
        
        playerX += dx;
        playerY += dy;
        
        // 경계선 제한
        if (playerX < 40) playerX = 40;
        if (playerX > canvas.width - 40) playerX = canvas.width - 40;
        if (playerY < 145) playerY = 145;
        if (playerY > canvas.height - 60) playerY = canvas.height - 60;
        
        // 이동 델타에 따라 수영 각도(playerDir) 결정
        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 1.5) {
                playerDir = dx > 0 ? 'right' : 'left';
            }
        } else {
            if (Math.abs(dy) > 1.5) {
                playerDir = dy > 0 ? 'down' : 'up';
            }
        }
        
        lastDragX = x;
        lastDragY = y;
    }
}

function handleEnd() {
    isDraggingPlayer = false;
}

// 마우스 클릭 및 드래그 이벤트 (PC용)
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (gameState === 'TRAIN_MOUSE' && targetBubble.active) {
        const dx = x - targetBubble.x;
        const dy = y - targetBubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= targetBubble.radius) {
            playerCoins++;
            playerEnergy = Math.min(100, playerEnergy + 3); 
            spawnBubble();
        }
    } else {
        handleStart(x, y);
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleMove(x, y);
});

window.addEventListener('mouseup', () => {
    handleEnd();
});

// 터치 이벤트 (모바일용)
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        if (gameState === 'TRAIN_MOUSE' && targetBubble.active) {
            const dx = x - targetBubble.x;
            const dy = y - targetBubble.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= targetBubble.radius) {
                playerCoins++;
                playerEnergy = Math.min(100, playerEnergy + 3); 
                spawnBubble();
            }
        } else {
            handleStart(x, y);
        }
    }
    // 수영장에서 화면 스크롤 바운스 방지
    if (gameState === 'SWIMMING_POOL') e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        handleMove(x, y);
    }
    if (gameState === 'SWIMMING_POOL') e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', () => {
    handleEnd();
});


// --- 화면 전환 헬퍼 함수 ---
function hideAllUIs() {
    uiLayer.style.display = 'none';
    missionUi.style.display = 'none';
    hubUi.style.display = 'none';
    difficultyUi.style.display = 'none';
    shopUi.style.display = 'none';
    keyboardPad.style.display = 'none';
}

function showHubMenu() {
    gameState = 'HUB_MENU';
    hideAllUIs();
    hubUi.style.display = 'flex';
    keys = {};
}

function showGymMenu() {
    gameState = 'GYM_MENU';
    hideAllUIs();
    missionUi.style.display = 'flex';
}

function showDifficultyMenu() {
    gameState = 'DIFFICULTY_SELECTION';
    hideAllUIs();
    difficultyUi.style.display = 'flex';
}

function showShopMenu() {
    gameState = 'SHOP_MENU';
    hideAllUIs();
    shopUi.style.display = 'flex';
    updateShopUI();
}

function updateShopUI() {
    shopCoinsText.innerText = playerCoins;
    
    if (hasFins) {
        buyFinsBtn.innerText = "보유 중";
        buyFinsBtn.disabled = true;
    } else {
        buyFinsBtn.innerText = "💰 30 코인";
        buyFinsBtn.disabled = playerCoins < 30;
    }

    if (hasGoggles) {
        buyGogglesBtn.innerText = "보유 중";
        buyGogglesBtn.disabled = true;
    } else {
        buyGogglesBtn.innerText = "💰 25 코인";
        buyGogglesBtn.disabled = playerCoins < 25;
    }

    buyDrinkBtn.disabled = playerCoins < 10 || playerEnergy >= 100;
}


// --- 훈련 도우미 함수 ---
function spawnBubble() {
    targetBubble.active = true;
    targetBubble.radius = 40;
    targetBubble.x = Math.random() * (canvas.width - 100) + 50;
    targetBubble.y = Math.random() * (canvas.height - 250) + 150;
}

function spawnKey() {
    const randomIndex = Math.floor(Math.random() * alphabets.length);
    targetKey = alphabets[randomIndex];
}


// --- 수영 플레이 도우미 함수 (종스크롤 방식) ---
function startSwimming() {
    gameState = 'SWIMMING_POOL';
    playerX = canvas.width / 2; // 중앙
    playerY = canvas.height - 120; // 아래 소환
    swimDistance = 0;
    obstacles = [];
    obstacleSpawnTimer = 0;
    isInvulnerable = false;
    invulnerableTimer = 0;
    showSwimResult = false;
    playerDir = 'up'; // 시작 방향은 위쪽
    keys = {};
}

function spawnObstacle() {
    let obstacleSymbols = [];
    let speedMin = 3;
    let speedMax = 5;
    
    if (currentDifficulty === 'easy') {
        obstacleSymbols = ['🛟', '⚽'];
        speedMin = 3;
        speedMax = 5;
    } else if (currentDifficulty === 'normal') {
        obstacleSymbols = ['🪵', '🦀'];
        speedMin = 5;
        speedMax = 8;
    } else if (currentDifficulty === 'hard') {
        obstacleSymbols = ['🦈'];
        speedMin = 9;
        speedMax = 12;
    }

    const randomSymbol = obstacleSymbols[Math.floor(Math.random() * obstacleSymbols.length)];
    const speed = Math.random() * (speedMax - speedMin) + speedMin;
    const x = Math.random() * (canvas.width - 80) + 40; // 40px ~ 410px 사이 스폰
    
    obstacles.push({
        x: x,
        y: 90, // 상단 헤더 바로 밑에서 스폰
        speed: speed,
        symbol: randomSymbol,
        size: 28, 
        // 하드 난이도에서는 좌우로 흔들리는 패턴 추가
        sinWave: currentDifficulty === 'hard' ? Math.random() * 2 + 1.5 : 0,
        angle: 0
    });
}

// 장애물 기호와 로드된 이미지 매핑
const obstacleImageMap = {
    '🛟': 'obsLifebuoy',
    '⚽': 'obsBeachball',
    '🪵': 'obsLog',
    '🦀': 'obsCrab',
    '🦈': 'obsShark'
};


// --- 게임 업데이트 루프 ---
function update() {
    if (gameState === 'SWIMMING_POOL') {
        if (showSwimResult) {
            swimResultTimer--;
            if (swimResultTimer <= 0) {
                showHubMenu();
            }
            return;
        }

        // 1. 캐릭터 조작 (세로 기준 상하좌우 및 방향 설정)
        const moveSpeed = hasFins ? 7 : 4;
        
        if (keys['ArrowUp'] || keys['KeyW']) {
            playerY -= moveSpeed;
            playerDir = 'up';
        } else if (keys['ArrowDown'] || keys['KeyS']) {
            playerY += moveSpeed;
            playerDir = 'down';
        }
        
        if (keys['ArrowLeft'] || keys['KeyA']) {
            playerX -= moveSpeed;
            playerDir = 'left';
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            playerX += moveSpeed;
            playerDir = 'right';
        }

        // 경계선 제한 (헤더 및 진행바 영역 확보)
        if (playerX < 40) playerX = 40;
        if (playerX > canvas.width - 40) playerX = canvas.width - 40;
        if (playerY < 145) playerY = 145;
        if (playerY > canvas.height - 60) playerY = canvas.height - 60;

        // 2. 무적 타이머
        if (isInvulnerable) {
            invulnerableTimer--;
            if (invulnerableTimer <= 0) {
                isInvulnerable = false;
            }
        }

        // 3. 체력 자연 감소
        playerEnergy -= 0.03;
        if (playerEnergy <= 0) {
            playerEnergy = 0;
            finishSwim(false);
            return;
        }

        // 4. 거리 누적 (위로 올라가는 연출)
        swimDistance += hasFins ? 2.5 : 1.8;
        if (swimDistance >= targetDistance) {
            finishSwim(true);
            return;
        }

        // 5. 배경 스크롤 오프셋 (위에서 아래로 흘러내림)
        laneOffset = (laneOffset + (hasFins ? 5 : 3.5)) % 1000;

        // 6. 장애물 생성 관리
        let spawnInterval = 80;
        if (currentDifficulty === 'easy') spawnInterval = 85;
        else if (currentDifficulty === 'normal') spawnInterval = 60;
        else if (currentDifficulty === 'hard') spawnInterval = 35;

        obstacleSpawnTimer++;
        if (obstacleSpawnTimer >= spawnInterval) {
            spawnObstacle();
            obstacleSpawnTimer = 0;
        }

        // 7. 장애물 이동 및 충돌 체크 (아래로 하강)
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.y += obs.speed; // 아래로 하강
            
            if (obs.sinWave > 0) {
                obs.angle += 0.05;
                obs.x += Math.sin(obs.angle) * obs.sinWave; // 좌우 흔들림
            }

            // 화면 아래로 나간 장애물 제거
            if (obs.y > canvas.height + 50) {
                obstacles.splice(i, 1);
                continue;
            }

            const dx = playerX - obs.x;
            const dy = playerY - obs.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < playerRadius + obs.size - 5) {
                if (!isInvulnerable) {
                    let damage = 15;
                    if (currentDifficulty === 'easy') damage = 10;
                    else if (currentDifficulty === 'normal') damage = 20;
                    else if (currentDifficulty === 'hard') damage = 35;

                    if (hasGoggles) {
                        damage = Math.floor(damage * 0.5);
                    }

                    playerEnergy = Math.max(0, playerEnergy - damage);
                    isInvulnerable = true;
                    invulnerableTimer = 90;

                    obstacles.splice(i, 1);

                    if (playerEnergy <= 0) {
                        finishSwim(false);
                        return;
                    }
                }
            }
        }
    }
}

function finishSwim(isWin) {
    showSwimResult = true;
    swimResultTimer = 180;
    
    if (isWin) {
        let rewardCoins = 15;
        if (currentDifficulty === 'easy') rewardCoins = 15;
        else if (currentDifficulty === 'normal') rewardCoins = 30;
        else if (currentDifficulty === 'hard') rewardCoins = 50;

        playerCoins += rewardCoins;
        swimResultMsg = "🎉 완주 성공! 보상: +" + rewardCoins + " 코인";
    } else {
        swimResultMsg = "💤 체력 충전이 필요해요! 체육관에서 충전하고 다시 도전해 봐요!";
    }
}


// --- 게임 그리기 루프 ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. 상태창 그리기 (450px 컴팩트 세로 모바일 헤더)
    if (gameState !== 'START_MENU') {
        ctx.fillStyle = "#1b2530"; 
        ctx.fillRect(0, 0, canvas.width, 100);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 100);
        ctx.lineTo(canvas.width, 100);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        
        // 체력바 (폭을 150px로 콤팩트화)
        ctx.font = "bold 16px Arial";
        ctx.fillText("❤️ 체력:", 15, 34);
        
        ctx.fillStyle = "#555555";
        ctx.fillRect(75, 18, 150, 22);
        
        if (playerEnergy > 50) ctx.fillStyle = "#2ecc71";
        else if (playerEnergy > 20) ctx.fillStyle = "#f39c12";
        else ctx.fillStyle = "#e74c3c";
        ctx.fillRect(75, 18, Math.max(0, playerEnergy) * 1.5, 22);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.fillText(Math.floor(playerEnergy) + " / 100", 125, 33);

        // 코인 (오른쪽 배치)
        ctx.font = "bold 16px Arial";
        ctx.fillText("💰 코인: " + playerCoins, 255, 34);
        
        // 보유 장비 2행 배치
        ctx.fillText("장비:", 15, 74);
        
        // 오리발 뱃지
        if (hasFins) {
            ctx.fillStyle = "#e8f5e9";
            ctx.fillRect(65, 57, 75, 25);
            ctx.strokeStyle = "#4caf50";
            ctx.strokeRect(65, 57, 75, 25);
            ctx.fillStyle = "#1b5e20";
            ctx.font = "bold 12px Arial";
            ctx.fillText("🦶 오리발", 72, 74);
        } else {
            ctx.fillStyle = "#333333";
            ctx.fillRect(65, 57, 75, 25);
            ctx.strokeStyle = "#555555";
            ctx.strokeRect(65, 57, 75, 25);
            ctx.fillStyle = "#888888";
            ctx.font = "12px Arial";
            ctx.fillText("🦶 없음", 78, 74);
        }

        // 물안경 뱃지
        if (hasGoggles) {
            ctx.fillStyle = "#e3f2fd";
            ctx.fillRect(150, 57, 75, 25);
            ctx.strokeStyle = "#2196f3";
            ctx.strokeRect(150, 57, 75, 25);
            ctx.fillStyle = "#0d47a1";
            ctx.font = "bold 12px Arial";
            ctx.fillText("🦪 물안경", 157, 74);
        } else {
            ctx.fillStyle = "#333333";
            ctx.fillRect(150, 57, 75, 25);
            ctx.strokeStyle = "#555555";
            ctx.strokeRect(150, 57, 75, 25);
            ctx.fillStyle = "#888888";
            ctx.font = "12px Arial";
            ctx.fillText("🦪 없음", 163, 74);
        }
    }

    if (gameState === 'HUB_MENU' || gameState === 'DIFFICULTY_SELECTION' || gameState === 'SHOP_MENU') {
        if (isAssetsLoaded && images.bgGym && images.bgGym.complete && images.bgGym.naturalHeight > 0) {
            ctx.drawImage(images.bgGym, 0, 100, canvas.width, canvas.height - 100);
            ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
            ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
        } else {
            ctx.fillStyle = "#1b2530";
            ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
        }
    } 
    else if (gameState === 'GYM_MENU') {
        if (isAssetsLoaded && images.bgGym && images.bgGym.complete && images.bgGym.naturalHeight > 0) {
            ctx.drawImage(images.bgGym, 0, 100, canvas.width, canvas.height - 100);
        } else {
            ctx.fillStyle = "#FFF8DC"; 
            ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
        }
    } 
    else if (gameState === 'TRAIN_MOUSE') {
        if (isAssetsLoaded && images.bgGym && images.bgGym.complete && images.bgGym.naturalHeight > 0) {
            ctx.drawImage(images.bgGym, 0, 100, canvas.width, canvas.height - 100);
            ctx.fillStyle = "rgba(224, 255, 255, 0.4)";
            ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
        } else {
            ctx.fillStyle = "#E0FFFF"; 
            ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
        }

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "bold 15px Arial";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText("🎈 나타나는 물방울을 터트려봐요! (나가기: ESC)", canvas.width / 2, 130);
        ctx.shadowBlur = 0; 

        if (targetBubble.active) {
            ctx.beginPath();
            ctx.arc(targetBubble.x, targetBubble.y, targetBubble.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(135, 206, 235, 0.85)";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "blue";
            ctx.stroke();
            
            ctx.fillStyle = "black";
            ctx.font = "20px Arial";
            ctx.fillText("💦", targetBubble.x, targetBubble.y + 7);
        }
    }
    else if (gameState === 'TRAIN_KEYBOARD') {
        if (isAssetsLoaded && images.bgGym && images.bgGym.complete && images.bgGym.naturalHeight > 0) {
            ctx.drawImage(images.bgGym, 0, 100, canvas.width, canvas.height - 100);
            ctx.fillStyle = "rgba(255, 240, 245, 0.4)";
            ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
        } else {
            ctx.fillStyle = "#FFF0F5"; 
            ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
        }

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "bold 15px Arial";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText("⌨️ 화면에 나오는 알파벳을 찾아 눌러요! (나가기: ESC)", canvas.width / 2, 130);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ff5722";
        ctx.font = "bold 130px Arial";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 6;
        ctx.strokeText(targetKey, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText(targetKey, canvas.width / 2, canvas.height / 2 + 50);
    }
    else if (gameState === 'SWIMMING_POOL') {
        // 1. 수영장 위에서 아래로(Y방향) 종스크롤 물 배경 (난이도별 다르게 드로잉)
        let bgImgKey = 'bgWater';
        if (currentDifficulty === 'normal') bgImgKey = 'bgValley';
        else if (currentDifficulty === 'hard') bgImgKey = 'bgOcean';
        
        const bgImg = images[bgImgKey];
        if (isAssetsLoaded && bgImg && bgImg.complete && bgImg.naturalHeight > 0) {
            const startY = laneOffset % bgImg.height;
            for (let y = startY - bgImg.height; y < canvas.height + bgImg.height; y += bgImg.height) {
                ctx.drawImage(bgImg, 0, y, canvas.width, bgImg.height);
            }
        } else {
            // 대체 색상 배경 (이미지 로드 전 폴백)
            if (currentDifficulty === 'easy') ctx.fillStyle = "#00b0ff"; // 푸른 수영장
            else if (currentDifficulty === 'normal') ctx.fillStyle = "#26a69a"; // 계곡 민트색
            else ctx.fillStyle = "#0d47a1"; // 깊은 바다 파란색
            ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
            
            // 대체 세로 레인 구분선
            ctx.strokeStyle = "rgba(255,255,255,0.4)";
            ctx.lineWidth = 4;
            ctx.setLineDash([20, 20]);
            const laneWidths = [150, 300];
            laneWidths.forEach(w => {
                ctx.beginPath();
                ctx.moveTo(w, laneOffset % 100);
                ctx.lineTo(w, canvas.height + 100);
                ctx.stroke();
            });
            ctx.setLineDash([]);
        }

        // 2. 장애물 하강 렌더링
        obstacles.forEach(obs => {
            const imgKey = obstacleImageMap[obs.symbol];
            const obsImg = images[imgKey];
            if (isAssetsLoaded && obsImg && obsImg.complete && obsImg.naturalHeight > 0) {
                ctx.drawImage(obsImg, obs.x - obs.size, obs.y - obs.size, obs.size * 2, obs.size * 2);
            } else {
                ctx.font = (obs.size * 1.2) + "px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(obs.symbol, obs.x, obs.y);
            }
        });

        // 3. 플레이어 캐릭터 연출 (세로 종스크롤 맞춤형: 엉덩이 흔들기 & 좌우 수영 프레임 교차)
        let shouldDrawPlayer = true;
        if (isInvulnerable && Math.floor(invulnerableTimer / 5) % 2 === 0) {
            shouldDrawPlayer = false;
        }

        if (shouldDrawPlayer && playerCharacter) {
            let drawnFromImage = false;
            const charInfo = characters[playerCharacter];
            if (charInfo) {
                // 현재 이동 방향에 해당하는 3D Voxel 이미지 키 선택
                const imgKey = "char_" + charInfo.prefix + "_" + playerDir;
                const pImg = images[imgKey];
                
                if (isAssetsLoaded && pImg && pImg.complete && pImg.naturalHeight > 0) {
                    // 수영 모션 생동감을 위한 물리 효과 (Hip Sway & Bob)
                    const swimSway = Math.sin(Date.now() / 150) * 0.07; // 좌우 실룩임
                    const swimBobY = Math.sin(Date.now() / 100) * 2;    // 상하 출렁임
                    
                    // 각 방향별 스프라이트 크기 보정 (좌우는 가로가 더 길고, 상하는 세로가 더 김)
                    let pWidth = 55;
                    let pHeight = 80;
                    if (playerDir === 'left' || playerDir === 'right') {
                        pWidth = 80;
                        pHeight = 55;
                    }
                    
                    ctx.save();
                    ctx.translate(playerX, playerY + swimBobY);
                    ctx.rotate(swimSway);
                    
                    ctx.drawImage(pImg, -pWidth / 2, -pHeight / 2, pWidth, pHeight);
                    ctx.restore();
                    drawnFromImage = true;
                }
            }

            if (!drawnFromImage) {
                ctx.font = "50px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(playerCharacter, playerX, playerY);
            }
        }

        // 4. 모바일형 가로 컴팩트 진행률 안내 바 (상단에 미니 사이즈로 노출)
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(80, 110, 290, 12);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 110, 290, 12);

        const progressPercent = Math.min(1.0, swimDistance / targetDistance);
        ctx.fillStyle = "#ffeb3b";
        ctx.fillRect(81, 111, progressPercent * 288, 10);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🚩", 60, 121);
        ctx.fillText("🏆", 390, 121);

        // 진행바 미니 플레이어 표시
        ctx.font = "14px Arial";
        ctx.fillText(playerCharacter, 80 + progressPercent * 280, 103);

        // 5. 완주 / 실패 결과 오버레이 연출
        if (showSwimResult) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(0, 100, canvas.width, canvas.height - 100);

            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.font = "bold 22px Arial";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "black";
            ctx.shadowBlur = 4;
            ctx.fillText(swimResultMsg, canvas.width / 2, canvas.height / 2 - 20);
            
            ctx.font = "15px Arial";
            ctx.fillStyle = "#cccccc";
            ctx.fillText("잠시 후 로비로 이동합니다...", canvas.width / 2, canvas.height / 2 + 30);
            ctx.shadowBlur = 0;
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 시작
gameLoop();
