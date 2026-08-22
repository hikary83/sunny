// 🏆 수영 챔피언: 성장형 스포츠 게임 - JavaScript 로직 (v2.3)

// --- Firebase 가상 연동 & 데이터 모델 ---
let playerDb = {}; // 가상 클라우드 DB 역할 (로컬 동기화 테스트용)

const presetNicknames = ["마린보이", "인어공주", "물개왕", "아기상어", "펠프스", "태양의후예", "수영천재", "물방울왕자", "바다거북", "아쿠아맨"];

// 초기 플레이어 상태 정의
let player = {
    name: "마린보이",
    gender: "boy",
    code: "SWIM-0000",
    coins: 100,
    level: 1,
    unlockedStage: 1, // 해금된 최고 스테이지 단계 (1~10)
    // 4대 능력치
    strength: 1,
    endurance: 1,
    speed: 1,
    focus: 1,
    // 장비 인벤토리 및 장착 정보
    equippedSwimsuit: "basic",
    equippedGear: "none",
    ownedSwimsuits: ["basic"],
    ownedGears: ["none"],
    // 소모성 버프 상태
    energyDrinkBoost: 0, // 다음 대회 추가 속도 버프
    proteinBuff: false,  // 다음 훈련 획득 능력치 2배
    spurtExtraCharge: 0  // 다음 대회 스퍼트 충전 횟수 추가
};

// --- DOM 엘리먼트 캐싱 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const createCharUi = document.getElementById('create-char-ui');
const hubUi = document.getElementById('hub-ui');
const gymUi = document.getElementById('gym-ui');
const difficultyUi = document.getElementById('difficulty-ui');
const shopUi = document.getElementById('shop-ui');
const keyboardPad = document.getElementById('keyboard-pad');
const btnGymFinishExit = document.getElementById('btn-gym-finish-exit');

// 캐릭터 생성 관련
const btnGenderBoy = document.getElementById('btn-gender-boy');
const btnGenderGirl = document.getElementById('btn-gender-girl');
const nameSelect = document.getElementById('name-select');
const inputLoginCode = document.getElementById('input-login-code');
const btnLoadCode = document.getElementById('btn-load-code');
const btnStartGame = document.getElementById('btn-start-game');

// 로비 관련
const lobbyCodeText = document.getElementById('lobby-code-text');
const displayName = document.getElementById('display-name');
const displayLevel = document.getElementById('display-level');
const displayBodyDesc = document.getElementById('display-body-desc');
const valStrength = document.getElementById('val-strength');
const valEndurance = document.getElementById('val-endurance');
const valSpeed = document.getElementById('val-speed');
const valFocus = document.getElementById('val-focus');
const fillStrength = document.getElementById('fill-strength');
const fillEndurance = document.getElementById('fill-endurance');
const fillSpeed = document.getElementById('fill-speed');
const fillFocus = document.getElementById('fill-focus');
const lobbyCoins = document.getElementById('lobby-coins');
const btnGoSwim = document.getElementById('btn-go-swim');
const btnGoGym = document.getElementById('btn-go-gym');
const btnGoShop = document.getElementById('btn-go-shop');
const btnResetChar = document.getElementById('btn-reset-char');

// 체육관 관련
const btnGymBack = document.getElementById('btn-gym-back');
const gymButtons = [
    document.getElementById('btn-train-boxing'),
    document.getElementById('btn-train-lifting'),
    document.getElementById('btn-train-running'),
    document.getElementById('btn-train-stretch'),
    document.getElementById('btn-train-rope'),
    document.getElementById('btn-train-form'),
    document.getElementById('btn-train-reaction'),
    document.getElementById('btn-train-mash'),
    document.getElementById('btn-train-rhythm'),
    document.getElementById('btn-train-memory')
];

// 대회 지도 관련
const btnDiffBack = document.getElementById('btn-diff-back');
const stageButtons = Array.from({length: 10}, (_, i) => document.getElementById("btn-stage-" + (i+1)));

// 상점 관련
const btnShopBack = document.getElementById('btn-shop-back');
const tabSwimsuit = document.getElementById('tab-swimsuit');
const tabGear = document.getElementById('tab-gear');
const tabSupplement = document.getElementById('tab-supplement');
const shopItemsList = document.getElementById('shop-items-list');
const shopCoins = document.getElementById('shop-coins');

// --- 게임 엔진 상태 관리 ---
let gameState = 'START_MENU'; // START_MENU, HUB_LOBBY, GYM_TRAINING, SWIMMING_RACE
let currentGymGame = ''; // BOXING, LIFTING, RUNNING, STRETCH, ROPE, FORM, REACTION, MASH, RHYTHM, MEMORY
let currentRaceStage = 1; // 1~10 단계
let showFeedbackMessage = "";
let feedbackTimer = 0;

// --- 이미지 리소스 매니저 ---
const images = {};
const imageSources = {
    bg_gym: 'assets/bg_gym.png',
    bg_water: 'assets/bg_water.png',
    bg_valley: 'assets/bg_valley.png',
    bg_ocean: 'assets/bg_ocean.png',
    item_drink: 'assets/item_drink.png',
    item_fins: 'assets/item_fins.png',
    item_goggles: 'assets/item_goggles.png',
    obs_beachball: 'assets/obs_beachball.png',
    obs_log: 'assets/obs_log.png',
    obs_rock: 'assets/obs_rock.png',
    char_boy_lv1: 'assets/char_boy_lv1.png',
    char_boy_lv3: 'assets/char_boy_lv3.png',
    char_boy_lv5: 'assets/char_boy_lv5.png',
    char_boy_lv7: 'assets/char_boy_lv7.png',
    char_boy_lv10: 'assets/char_boy_lv10.png',
    char_girl_lv1: 'assets/char_girl_lv1.png',
    char_girl_lv3: 'assets/char_girl_lv3.png',
    char_girl_lv5: 'assets/char_girl_lv5.png',
    char_girl_lv7: 'assets/char_girl_lv7.png',
    char_girl_lv10: 'assets/char_girl_lv10.png',
    icon_touch_tap: 'assets/icon_touch_tap.png'
};

let imagesLoadedCount = 0;
let isAssetsLoaded = false;
const totalImages = Object.keys(imageSources).length;

for (let key in imageSources) {
    images[key] = new Image();
    images[key].src = imageSources[key];
    images[key].onload = () => {
        imagesLoadedCount++;
        if (imagesLoadedCount === totalImages) {
            isAssetsLoaded = true;
        }
    };
    images[key].onerror = () => {
        imagesLoadedCount++;
        if (imagesLoadedCount === totalImages) {
            isAssetsLoaded = true;
        }
    };
}

// --- 기기 연동 코드 생성기 ---
function generateContinueCode() {
    const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZ23456789"; // 혼동 우려 문자 제거
    let codeResult = "SWIM-";
    for (let i = 0; i < 4; i++) {
        codeResult += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codeResult;
}

// 로컬 스토리지 자동 저장
function savePlayerData() {
    player.level = Math.floor((player.strength + player.endurance + player.speed + player.focus) / 4);
    if (player.level < 1) player.level = 1;
    
    // 로컬 스토리지 저장
    localStorage.setItem('swimmer_save', JSON.stringify(player));
    
    // 가상 데이터베이스 동기화
    playerDb[player.code] = JSON.parse(JSON.stringify(player));
    localStorage.setItem('swimmer_db_mock', JSON.stringify(playerDb));
}

// 기기 간 연동 코드로 정보 가져오기
function loadPlayerDataByCode(codeToLoad) {
    const cleanCode = codeToLoad.trim().toUpperCase();
    if (playerDb[cleanCode]) {
        player = JSON.parse(JSON.stringify(playerDb[cleanCode]));
        savePlayerData();
        updateLobbyUI();
        return true;
    }
    return false;
}

// 로컬 세이브 로드 초기화
function initPlayerData() {
    // 가상 DB 복원
    const mockDbRaw = localStorage.getItem('swimmer_db_mock');
    if (mockDbRaw) {
        playerDb = JSON.parse(mockDbRaw);
    }
    
    const localSave = localStorage.getItem('swimmer_save');
    if (localSave) {
        player = JSON.parse(localSave);
        gameState = 'HUB_LOBBY';
        hideAllUIs();
        hubUi.style.display = 'flex';
        updateLobbyUI();
        sfx.startBgm();
    } else {
        player.code = generateContinueCode();
        gameState = 'START_MENU';
        hideAllUIs();
        createCharUi.style.display = 'flex';
    }
}

// --- 능력치에 따른 외형 설명 매핑 ---
function getBodyDescription(lv) {
    if (lv === 1) return "🧍 빼빼 마른 꿈나무 (외형 1단계)";
    if (lv === 2) return "🧍 아주 살짝 탄탄해진 느낌 (외형 2단계)";
    if (lv === 3) return "💪 어깨가 조금 넓어짐 (외형 3단계)";
    if (lv === 4) return "💪 팔뚝에 근육 라인이 보임 (외형 4단계)";
    if (lv === 5) return "🏋️ 복근의 윤곽이 드러남 (외형 5단계)";
    if (lv === 6) return "🏋️ 뚜렷하고 넓어진 어깨프레임 (외형 6단계)";
    if (lv === 7) return "🏊 멋진 역삼각형 상체형 (외형 7단계)";
    if (lv === 8) return "🏊 선명하게 박힌 식스팩 복근 (외형 8단계)";
    if (lv === 9) return "🏆 완벽한 프로 수영선수 피지컬 (외형 9단계)";
    return "👑 전설의 챔피언 완벽 체형! (외형 10단계)";
}

// --- UI 업데이트 헬퍼들 ---
function hideAllUIs() {
    createCharUi.style.display = 'none';
    hubUi.style.display = 'none';
    gymUi.style.display = 'none';
    difficultyUi.style.display = 'none';
    shopUi.style.display = 'none';
    keyboardPad.style.display = 'none';
    btnGymFinishExit.style.display = 'none';
}

function updateLobbyUI() {
    lobbyCodeText.innerText = player.code;
    displayName.innerText = (player.gender === "boy" ? "👦 " : "👧 ") + player.name;
    displayLevel.innerText = "Lv." + player.level;
    displayBodyDesc.innerText = getBodyDescription(player.level);
    
    valStrength.innerText = player.strength;
    valEndurance.innerText = player.endurance;
    valSpeed.innerText = player.speed;
    valFocus.innerText = player.focus;
    
    // 최대 스탯 50 기준 퍼센트 계산
    fillStrength.style.width = Math.min(100, (player.strength / 50) * 100) + "%";
    fillEndurance.style.width = Math.min(100, (player.endurance / 50) * 100) + "%";
    fillSpeed.style.width = Math.min(100, (player.speed / 50) * 100) + "%";
    fillFocus.style.width = Math.min(100, (player.focus / 50) * 100) + "%";
    
    lobbyCoins.innerText = player.coins;
    
    // 신규 훈련 해금 표시
    gymButtons.forEach(btn => {
        if (!btn) return;
        const req = parseInt(btn.getAttribute('data-req-lv'));
        if (player.level >= req) {
            btn.classList.remove('locked');
            // 자물쇠 제거텍스트
            const titleEl = btn.querySelector('.course-name');
            if (titleEl && titleEl.innerText.includes('🔒')) {
                titleEl.innerText = titleEl.innerText.replace(' 🔒', '');
            }
        } else {
            btn.classList.add('locked');
        }
    });

    // 대회 맵 잠금 처리
    stageButtons.forEach((btn, idx) => {
        if (!btn) return;
        const stageNum = idx + 1;
        const reqLevel = parseInt(btn.getAttribute('data-req-lv'));
        
        if (player.level >= reqLevel && stageNum <= player.unlockedStage) {
            btn.classList.remove('locked');
            const titleEl = btn.querySelector('.stage-title');
            if (titleEl && titleEl.innerText.includes('🔒')) {
                titleEl.innerText = titleEl.innerText.replace(' 🔒', '');
            }
        } else {
            btn.classList.add('locked');
        }
    });
}

// 상점 아이템 리스트 렌더링
const shopItemsData = {
    swimsuit: [
        { id: "swimsuit_basic", name: "기본 수영복", price: 0, desc: "기본 지급 수영복", effect: "없음" },
        { id: "swimsuit_sport", name: "스포츠 수영복", price: 30, desc: "물살을 가르는 스포티 수영복", effect: "⚡ 스피드 +2" },
        { id: "swimsuit_pro", name: "프로 레이싱복", price: 80, desc: "전신 저항을 줄여주는 수트", effect: "⚡ 스피드 +4, 💪 근력 +2" },
        { id: "swimsuit_champ", name: "챔피언 수영복", price: 150, desc: "황금빛 챔피언 아우라 코팅", effect: "⚡ 스피드 +6, 💪 근력 +4" }
    ],
    gear: [
        { id: "gear_cap", name: "알록달록 수영모", price: 15, desc: "머리 저항을 줄여주는 기본 캡", effect: "🫀 지구력 +2" },
        { id: "gear_goggles", name: "요술 물안경", price: 20, desc: "시야를 확보해주는 필수품", effect: "🧠 집중력 +2" },
        { id: "gear_fins", name: "아기 오리발", price: 40, desc: "추진력을 높여주는 파란 오리발", effect: "⚡ 스피드 +4" },
        { id: "gear_progoggles", name: "프로 레이싱 고글", price: 60, desc: "물결 왜곡이 전혀 없는 고글", effect: "🧠 집중력 +4, 🫀 지구력 +1" },
        { id: "gear_superfins", name: "최고급 오리발", price: 100, desc: "카본 강화 블레이드 탑재 오리발", effect: "⚡ 스피드 +7, 🫀 지구력 +2" }
    ],
    supplement: [
        { id: "supp_choco", name: "에너지 초코바 🍫", price: 5, desc: "빠르게 훈련 의욕을 채워주는 바", effect: "💪 근력 훈련 스탯 즉시 +1" },
        { id: "supp_drink", name: "파워 에너지 드링크 🥤", price: 10, desc: "다음 대회 출전 시 기본 속도가 증가", effect: "⚡ 다음 대회 1회 속도 증가" },
        { id: "supp_protein", name: "단백질 보충제 💪", price: 15, desc: "체육관 훈련 시 스탯 획득 2배 버프", effect: "💪 다음 훈련 시 획득 포인트 2배" },
        { id: "supp_special", name: "골드 스페셜 드링크 ⭐", price: 25, desc: "대회 중 스퍼트 횟수 1회 증가", effect: "⚡ 다음 대회 1회 스퍼트 충전 +1" }
    ]
};

let currentShopTab = "swimsuit";

function renderShop() {
    shopCoins.innerText = player.coins;
    shopItemsList.innerHTML = "";
    
    const items = shopItemsData[currentShopTab];
    items.forEach(item => {
        const isOwned = player.ownedSwimsuits.includes(item.id) || player.ownedGears.includes(item.id);
        const isEquipped = player.equippedSwimsuit === item.id || player.equippedGear === item.id;
        
        let btnText = "💰 " + item.price + " 코인";
        let btnClass = "shop-item-buy-btn";
        let isBtnDisabled = false;
        
        if (currentShopTab !== "supplement") {
            if (isEquipped) {
                btnText = "장착됨";
                btnClass += " equipped";
                isBtnDisabled = true;
            } else if (isOwned) {
                btnText = "장착하기";
                btnClass += " owned";
            }
        }
        
        if (!isOwned && !isBtnDisabled && player.coins < item.price) {
            isBtnDisabled = true;
        }
        
        const card = document.createElement('div');
        card.className = "shop-item-card";
        
        let imgName = "item_drink.png";
        if (item.id.includes("fins")) imgName = "item_fins.png";
        else if (item.id.includes("goggles")) imgName = "item_goggles.png";
        
        card.innerHTML = "\n            <img class=\"shop-item-img\" src=\"assets/" + (imgName) + "\" alt=\"" + (item.name) + "\">\n            <div class=\"shop-item-info\">\n                <div class=\"shop-item-name\">" + (item.name) + "</div>\n                <div class=\"shop-item-desc\">" + (item.desc) + "</div>\n                <div class=\"shop-item-desc\" style=\"color: #00bcd4; font-weight: bold;\">효과: " + (item.effect) + "</div>\n            </div>\n            <button class=\"" + (btnClass) + "\" " + (isBtnDisabled ? 'disabled' : '') + " data-id=\"" + (item.id) + "\">" + (btnText) + "</button>\n        ";
        
        shopItemsList.appendChild(card);
    });

    // 상점 안 버튼 클릭 리스너 바인딩
    document.querySelectorAll('.shop-item-buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.getAttribute('data-id');
            handleShopPurchase(itemId);
        });
    });
}

function handleShopPurchase(itemId) {
    let matchedItem = null;
    let category = "";
    
    for (let cat in shopItemsData) {
        matchedItem = shopItemsData[cat].find(i => i.id === itemId);
        if (matchedItem) {
            category = cat;
            break;
        }
    }
    
    if (!matchedItem) return;
    
    // 스킨/장비 이미 보유중이면 장착만 함
    const isOwned = player.ownedSwimsuits.includes(itemId) || player.ownedGears.includes(itemId);
    if (isOwned) {
        if (category === "swimsuit") player.equippedSwimsuit = itemId;
        else if (category === "gear") player.equippedGear = itemId;
        savePlayerData();
        renderShop();
        return;
    }
    
    // 구매 진행
    if (player.coins >= matchedItem.price) {
        player.coins -= matchedItem.price;
        
        if (category === "swimsuit") {
            player.ownedSwimsuits.push(itemId);
            player.equippedSwimsuit = itemId;
            // 스탯 적용
            if (itemId === "swimsuit_sport") player.speed += 2;
            else if (itemId === "swimsuit_pro") { player.speed += 4; player.strength += 2; }
            else if (itemId === "swimsuit_champ") { player.speed += 6; player.strength += 4; }
        } else if (category === "gear") {
            player.ownedGears.push(itemId);
            player.equippedGear = itemId;
            // 스탯 적용
            if (itemId === "gear_cap") player.endurance += 2;
            else if (itemId === "gear_goggles") player.focus += 2;
            else if (itemId === "gear_fins") player.speed += 4;
            else if (itemId === "gear_progoggles") { player.focus += 4; player.endurance += 1; }
            else if (itemId === "gear_superfins") { player.speed += 7; player.endurance += 2; }
        } else if (category === "supplement") {
            // 소모품 적용
            if (itemId === "supp_choco") {
                player.strength += 1;
                triggerFeedback("🍫 초코바 냠냠! 근력 +1");
            } else if (itemId === "supp_drink") {
                player.energyDrinkBoost += 2;
                triggerFeedback("🥤 파워에너지 드링크 장전! 다음 대회 속도 증가");
            } else if (itemId === "supp_protein") {
                player.proteinBuff = true;
                triggerFeedback("💪 단백질 셰이크 원샷! 다음 훈련 획득 포인트 2배");
            } else if (itemId === "supp_special") {
                player.spurtExtraCharge += 1;
                triggerFeedback("⭐ 스페셜 드링크! 다음 대회 스퍼트 +1회");
            }
        }
        
        savePlayerData();
        renderShop();
    }
}

function triggerFeedback(msg) {
    showFeedbackMessage = msg;
    feedbackTimer = 120;
}

// --- 이벤트 바인딩 ---

// 1. 캐릭터 생성
btnGenderBoy.addEventListener('click', () => {
    btnGenderBoy.classList.add('active');
    btnGenderGirl.classList.remove('active');
    player.gender = 'boy';
});
btnGenderGirl.addEventListener('click', () => {
    btnGenderGirl.classList.add('active');
    btnGenderBoy.classList.remove('active');
    player.gender = 'girl';
});

btnStartGame.addEventListener('click', () => {
    player.name = nameSelect.value;
    gameState = 'HUB_LOBBY';
    savePlayerData();
    hideAllUIs();
    hubUi.style.display = 'flex';
    updateLobbyUI();
    sfx.startBgm(); // BGM 기동
});

btnLoadCode.addEventListener('click', () => {
    const code = inputLoginCode.value;
    if (loadPlayerDataByCode(code)) {
        alert("성공적으로 기기 데이터가 연동되었습니다!");
        gameState = 'HUB_LOBBY';
        hideAllUIs();
        hubUi.style.display = 'flex';
        sfx.startBgm(); // BGM 기동
    } else {
        alert("해당 코드를 찾을 수 없습니다. 다시 한 번 확인해 주세요.");
    }
});

// 소리 음소거 토글 버튼
const btnToggleSound = document.getElementById('btn-toggle-sound');
if (btnToggleSound) {
    btnToggleSound.addEventListener('click', () => {
        const muted = sfx.toggleMute();
        btnToggleSound.innerText = muted ? "🔇 소리 켜기" : "🔊 소리 끄기";
    });
}

// 공통 버튼 클릭 효과음 (이벤트 위임)
document.getElementById('game-container').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        sfx.playTick();
    }
});

btnResetChar.addEventListener('click', () => {
    if (confirm("정말로 캐릭터를 새로 만드시겠습니까? 기존 기록은 삭제됩니다.")) {
        localStorage.removeItem('swimmer_save');
        player = {
            name: "마린보이",
            gender: "boy",
            code: generateContinueCode(),
            coins: 100,
            level: 1,
            unlockedStage: 1,
            strength: 1,
            endurance: 1,
            speed: 1,
            focus: 1,
            equippedSwimsuit: "basic",
            equippedGear: "none",
            ownedSwimsuits: ["basic"],
            ownedGears: ["none"],
            energyDrinkBoost: 0,
            proteinBuff: false,
            spurtExtraCharge: 0
        };
        gameState = 'START_MENU';
        hideAllUIs();
        createCharUi.style.display = 'flex';
    }
});

// 2. 허브 메뉴 이동
btnGoGym.addEventListener('click', () => {
    gameState = 'GYM_SELECTION';
    hideAllUIs();
    gymUi.style.display = 'flex';
    updateLobbyUI();
});
btnGoSwim.addEventListener('click', () => {
    gameState = 'DIFFICULTY_SELECTION';
    hideAllUIs();
    difficultyUi.style.display = 'flex';
    updateLobbyUI();
});
btnGoShop.addEventListener('click', () => {
    gameState = 'SHOP_MENU';
    hideAllUIs();
    shopUi.style.display = 'flex';
    renderShop();
});

btnGymBack.addEventListener('click', () => {
    gameState = 'HUB_LOBBY';
    hideAllUIs();
    hubUi.style.display = 'flex';
    updateLobbyUI();
});
btnGymFinishExit.addEventListener('click', () => {
    gameState = 'GYM_SELECTION';
    hideAllUIs();
    gymUi.style.display = 'flex';
    updateLobbyUI();
});
btnDiffBack.addEventListener('click', () => {
    gameState = 'HUB_LOBBY';
    hideAllUIs();
    hubUi.style.display = 'flex';
    updateLobbyUI();
});
btnShopBack.addEventListener('click', () => {
    gameState = 'HUB_LOBBY';
    hideAllUIs();
    hubUi.style.display = 'flex';
    updateLobbyUI();
});

// 상점 탭 교체
tabSwimsuit.addEventListener('click', () => {
    currentShopTab = "swimsuit";
    tabSwimsuit.classList.add('active');
    tabGear.classList.remove('active');
    tabSupplement.classList.remove('active');
    renderShop();
});
tabGear.addEventListener('click', () => {
    currentShopTab = "gear";
    tabGear.classList.add('active');
    tabSwimsuit.classList.remove('active');
    tabSupplement.classList.remove('active');
    renderShop();
});
tabSupplement.addEventListener('click', () => {
    currentShopTab = "supplement";
    tabSupplement.classList.add('active');
    tabSwimsuit.classList.remove('active');
    tabGear.classList.remove('active');
    renderShop();
});

// 3. 체육관 훈련 선택 바인딩
gymButtons.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (btn.classList.contains('locked')) {
            alert("아직 훈련 레벨에 도달하지 못해 잠겨 있습니다!");
            return;
        }
        const gameId = btn.id.replace('btn-train-', '').toUpperCase();
        startGymTraining(gameId);
    });
});

// 4. 대회 스테이지 선택 바인딩
stageButtons.forEach((btn, idx) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (btn.classList.contains('locked')) {
            alert("대회 참가 조건이 안 되거나, 이전 단계를 먼저 우승하셔야 합니다!");
            return;
        }
        const stageNum = idx + 1;
        startSwimmingRace(stageNum);
    });
});


// ==========================================
// --- 체육관 훈련 (미니게임 10종) 논리 엔진 ---
// ==========================================

let gymState = {
    score: 0,
    targetCount: 10,
    timer: 0,
    elements: [],
    inputPrompt: "",
    inputText: "",
    gameState: "PLAYING"
};

function startGymTraining(gameId) {
    hideAllUIs();
    gameState = 'GYM_TRAINING';
    currentGymGame = gameId;
    gymState.score = 0;
    gymState.gameState = "PLAYING";
    gymState.elements = [];
    keyboardPad.style.display = 'none';

    if (gameId === 'BOXING') {
        gymState.timer = 600; // 10초 프레임 대략
        spawnPunchingTarget();
    } else if (gameId === 'LIFTING') {
        gymState.timer = 0;
        gymState.targetCount = 5;
        // 바벨 좌표 [x, y, targetY, isDragging]
        gymState.elements = [{ x: canvas.width / 2, y: 650, startY: 650, targetY: 200, isDragging: false }];
    } else if (gameId === 'RUNNING') {
        gymState.timer = 0;
        // 미로 경계선 그리기용 데이터 포인트
        gymState.elements = [];
        createRunningMaze();
    } else if (gameId === 'STRETCH') {
        keyboardPad.style.display = 'flex';
        gymState.targetCount = 10;
        spawnStretchKey();
    } else if (gameId === 'ROPE') {
        keyboardPad.style.display = 'flex';
        gymState.targetCount = 5;
        spawnRopeWord();
    } else if (gameId === 'FORM') {
        keyboardPad.style.display = 'flex';
        gymState.targetCount = 3;
        spawnFormSentence();
    } else if (gameId === 'REACTION') {
        gymState.elements = { status: 'RED', startTime: 0, clickTime: 0, nextChange: Date.now() + 2000 + Math.random() * 3000 };
    } else if (gameId === 'MASH') {
        gymState.timer = 300; // 5초
        gymState.elements = { tapCount: 0, targetTap: 30 };
    } else if (gameId === 'RHYTHM') {
        gymState.timer = 600;
        // 3개 레인, 물방울 생성 루프
        gymState.elements = [];
    } else if (gameId === 'MEMORY') {
        // 카드 8장 생성 (4쌍)
        const symbols = ['💪', '🫀', '⚡', '🧠', '💪', '🫀', '⚡', '🧠'];
        // Shuffle
        for (let i = symbols.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
        }
        gymState.elements = [];
        for (let i = 0; i < 8; i++) {
            gymState.elements.push({
                id: i,
                symbol: symbols[i],
                x: 80 + (i % 2) * 160,
                y: 180 + Math.floor(i / 2) * 130,
                w: 120,
                h: 100,
                flipped: false,
                matched: false
            });
        }
        gymState.selectedCards = [];
    }
}

// 🥊 복싱 타겟 스폰
function spawnPunchingTarget() {
    gymState.elements = [{
        x: 80 + Math.random() * (canvas.width - 160),
        y: 200 + Math.random() * (canvas.height - 400),
        radius: 40,
        color: '#f44336'
    }];
}

// 🧘 스트레칭 단일 키 생성
const alphabetKeys = "QWERTYUIOPASDFGHJKLZXCVBNM";
function spawnStretchKey() {
    gymState.inputPrompt = alphabetKeys.charAt(Math.floor(Math.random() * alphabetKeys.length));
}

// 🪢 줄넘기 짧은 단어 생성
const wordList = ["RUN", "SWIM", "JUMP", "FAST", "POOL", "GOLD", "STRETCH", "ROBLOX", "STITCH", "CHAMP"];
function spawnRopeWord() {
    gymState.inputPrompt = wordList[Math.floor(Math.random() * wordList.length)];
    gymState.inputText = "";
}

// 🏊 수영폼 연습 문장 생성
const sentenceList = ["SWIM IN THE POOL", "SPEED UP NOW", "GO FOR GOLD MEDAL", "GET THE POWER", "STRETCH YOUR BODY"];
function spawnFormSentence() {
    gymState.inputPrompt = sentenceList[Math.floor(Math.random() * sentenceList.length)];
    gymState.inputText = "";
}

// 🏃 장애물 미로 생성
function createRunningMaze() {
    // 트랙 경로: START(x: 50, y: 700) -> 꼬불꼬불 코스 -> END(x: 380, y: 200)
    gymState.elements = {
        startX: 60,
        startY: 700,
        endX: 380,
        endY: 180,
        path: [
            { x1: 30, y1: 650, x2: 120, y2: 750 },
            { x1: 90, y1: 450, x2: 120, y2: 670 },
            { x1: 90, y1: 420, x2: 300, y2: 480 },
            { x1: 270, y1: 280, x2: 300, y2: 450 },
            { x1: 150, y1: 250, x2: 290, y2: 310 },
            { x1: 150, y1: 120, x2: 180, y2: 270 },
            { x1: 170, y1: 120, x2: 420, y2: 210 }
        ],
        started: false
    };
}

// 장애물 트랙 안(흰 도로)에 터치 좌표가 위치하는지 판정
function isPointInRunningMaze(x, y) {
    const m = gymState.elements;
    // 출발점 혹은 종료점 부근은 안전 구역
    const distToStart = Math.hypot(x - m.startX, y - m.startY);
    const distToEnd = Math.hypot(x - m.endX, y - m.endY);
    if (distToStart < 40 || distToEnd < 40) return true;
    
    // 경로 라인 중 하나에 들어오는지 판단 (너비 기준 합산)
    for (let segment of m.path) {
        // 바운딩 박스 안 인지 판단
        const minX = Math.min(segment.x1, segment.x2) - 10;
        const maxX = Math.max(segment.x1, segment.x2) + 10;
        const minY = Math.min(segment.y1, segment.y2) - 10;
        const maxY = Math.max(segment.y1, segment.y2) + 10;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            return true;
        }
    }
    return false;
}

// 훈련 완료 후 스탯 증가 처리
function finishGymTraining(isSuccess) {
    gymState.gameState = "FINISHED";
    keyboardPad.style.display = 'none';
    btnGymFinishExit.style.display = 'flex';
    
    if (isSuccess) {
        // 단백질 보충제 버프 여부 (획득 스탯 2배)
        const mult = player.proteinBuff ? 2 : 1;
        player.proteinBuff = false; // 버프 초기화
        
        let rewardCoins = 0;
        
        if (currentGymGame === 'BOXING') {
            player.strength += 1 * mult;
            player.speed += 1 * mult;
            rewardCoins = 10;
        } else if (currentGymGame === 'LIFTING') {
            player.strength += 2 * mult;
            rewardCoins = 15;
        } else if (currentGymGame === 'RUNNING') {
            player.speed += 3 * mult;
            rewardCoins = 25;
        } else if (currentGymGame === 'STRETCH') {
            player.endurance += 1 * mult;
            rewardCoins = 10;
        } else if (currentGymGame === 'ROPE') {
            player.endurance += 2 * mult;
            rewardCoins = 15;
        } else if (currentGymGame === 'FORM') {
            player.endurance += 3 * mult;
            rewardCoins = 25;
        } else if (currentGymGame === 'REACTION') {
            player.speed += 2 * mult;
            rewardCoins = 15;
        } else if (currentGymGame === 'MASH') {
            player.strength += 2 * mult;
            rewardCoins = 15;
        } else if (currentGymGame === 'RHYTHM') {
            player.endurance += 2 * mult;
            rewardCoins = 20;
        } else if (currentGymGame === 'MEMORY') {
            player.focus += 3 * mult;
            rewardCoins = 20;
        }
        
        player.coins += rewardCoins;
        savePlayerData();
        sfx.playVictory(); // 우승 효과음
        
        triggerFeedback("🎉 훈련 성공! 능력치 성장 & +" + (rewardCoins) + "코인 획득!");
    } else {
        sfx.playFailure(); // 실패 효과음
        triggerFeedback("😢 아쉽게 실패했습니다. 다시 도전해보세요!");
    }
}

// 체육관 그리기 로직
function drawGymTraining() {
    // 배경
    if (images.bg_gym && images.bg_gym.complete && images.bg_gym.naturalHeight > 0) {
        ctx.drawImage(images.bg_gym, 0, 100, canvas.width, canvas.height - 100);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
    } else {
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
    }
    
    // 타이틀바 그리기
    ctx.fillStyle = "#1e272e";
    ctx.fillRect(0, 0, canvas.width, 100);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🏋️ 훈련 중: " + (currentGymGame), canvas.width / 2, 40);
    
    if (gymState.gameState === "PLAYING") {
        ctx.font = "14px Arial";
        ctx.fillStyle = "#ffeb3b";
        
        if (currentGymGame === 'BOXING') {
            ctx.fillText("남은 목표 터치: " + (10 - gymState.score) + "회", canvas.width / 2, 75);
            // 과녁 그리기
            const target = gymState.elements[0];
            if (target) {
                ctx.beginPath();
                ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
                ctx.fillStyle = target.color;
                ctx.fill();
                ctx.lineWidth = 4;
                ctx.strokeStyle = "#ffffff";
                ctx.stroke();
                
                // 중심 과녁 원선
                ctx.beginPath();
                ctx.arc(target.x, target.y, target.radius / 2, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
            }
        } else if (currentGymGame === 'LIFTING') {
            ctx.fillText("역기 들어올리기: " + (gymState.score) + " / 5회 성공", canvas.width / 2, 75);
            const barbell = gymState.elements[0];
            
            // 끌고 가야할 목표선 점선 그리기
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "#4caf50";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, barbell.targetY);
            ctx.lineTo(canvas.width, barbell.targetY);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // 바벨 렌더링
            ctx.fillStyle = "#7f8c8d";
            ctx.fillRect(barbell.x - 100, barbell.y - 10, 200, 20); // 바 봉
            ctx.fillStyle = "#2c3e50";
            ctx.fillRect(barbell.x - 130, barbell.y - 40, 30, 80); // 왼쪽 원판
            ctx.fillRect(barbell.x + 100, barbell.y - 40, 30, 80); // 오른쪽 원판
            
            // 안내 텍스트
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px Arial";
            ctx.fillText("역기를 위쪽 초록 점선까지 꾹~ 드래그하세요!", canvas.width / 2, 750);
        } else if (currentGymGame === 'RUNNING') {
            ctx.fillText("장애물 트랙 통과 (START ➡️ END 드래그)", canvas.width / 2, 75);
            
            const m = gymState.elements;
            
            // 맵 전체 트랙 벽(빨간색 위험구간)과 흰 도로 그리기
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(20, 110, canvas.width - 40, canvas.height - 180);
            
            // 흰 도로 그리기
            ctx.lineWidth = 50;
            ctx.strokeStyle = "#ffffff";
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(m.startX, m.startY);
            for (let seg of m.path) {
                ctx.lineTo(seg.x2, seg.y2);
            }
            ctx.lineTo(m.endX, m.endY);
            ctx.stroke();
            
            // 출발선 (START)
            ctx.fillStyle = "#2ecc71";
            ctx.beginPath();
            ctx.arc(m.startX, m.startY, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px Arial";
            ctx.fillText("START", m.startX, m.startY + 4);
            
            // 종료선 (END)
            ctx.fillStyle = "#f1c40f";
            ctx.beginPath();
            ctx.arc(m.endX, m.endY, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#000000";
            ctx.fillText("END", m.endX, m.endY + 4);
        } else if (currentGymGame === 'STRETCH') {
            ctx.fillText("가상 키보드로 한 글자 누르기 (" + (gymState.score) + " / " + (gymState.targetCount) + ")", canvas.width / 2, 75);
            
            // 대형 타겟 표시
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(canvas.width / 2 - 60, 250, 120, 120);
            ctx.strokeStyle = "#00bcd4";
            ctx.lineWidth = 5;
            ctx.strokeRect(canvas.width / 2 - 60, 250, 120, 120);
            
            ctx.fillStyle = "#2c3e50";
            ctx.font = "bold 55px Arial";
            ctx.fillText(gymState.inputPrompt, canvas.width / 2, 330);
        } else if (currentGymGame === 'ROPE') {
            ctx.fillText("줄넘기: 단어 타이핑 (" + (gymState.score) + " / " + (gymState.targetCount) + ")", canvas.width / 2, 75);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px Arial";
            ctx.fillText("제시 단어:", canvas.width / 2, 220);
            
            ctx.fillStyle = "#ffeb3b";
            ctx.font = "bold 45px Arial";
            ctx.fillText(gymState.inputPrompt, canvas.width / 2, 280);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 30px Arial";
            ctx.fillText(gymState.inputText + "_", canvas.width / 2, 380);
        } else if (currentGymGame === 'FORM') {
            ctx.fillText("수영폼: 문장 타이핑 (" + (gymState.score) + " / " + (gymState.targetCount) + ")", canvas.width / 2, 75);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 18px Arial";
            ctx.fillText("제시된 문장:", canvas.width / 2, 220);
            
            ctx.fillStyle = "#ffeb3b";
            ctx.font = "bold 24px Arial";
            ctx.fillText(gymState.inputPrompt, canvas.width / 2, 270);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px Arial";
            ctx.fillText(gymState.inputText + "_", canvas.width / 2, 350);
        } else if (currentGymGame === 'REACTION') {
            const rx = gymState.elements;
            
            // 신호등 렌더링
            ctx.fillStyle = "#2c3e50";
            ctx.fillRect(canvas.width / 2 - 60, 200, 120, 300);
            
            // 빨간불
            ctx.beginPath();
            ctx.arc(canvas.width / 2, 270, 40, 0, Math.PI * 2);
            ctx.fillStyle = (rx.status === 'RED') ? '#ff1744' : '#551122';
            ctx.fill();
            
            // 초록불
            ctx.beginPath();
            ctx.arc(canvas.width / 2, 410, 40, 0, Math.PI * 2);
            ctx.fillStyle = (rx.status === 'GREEN') ? '#00e676' : '#114422';
            ctx.fill();
            
            // 텍스트 안내
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px Arial";
            if (rx.status === 'RED') {
                ctx.fillText("초록불이 켜질 때까지 기다리세요!", canvas.width / 2, 570);
            } else if (rx.status === 'GREEN') {
                ctx.fillStyle = "#00e676";
                ctx.font = "bold 32px Arial";
                ctx.fillText("터치 하세요 (TAP NOW)!!!", canvas.width / 2, 570);
            }
        } else if (currentGymGame === 'MASH') {
            const tap = gymState.elements;
            gymState.timer--;
            
            ctx.fillText("5초 폭풍 연타! 남은시간: " + (Math.max(0, Math.ceil(gymState.timer / 60))) + "초", canvas.width / 2, 75);
            
            // 게이지바
            ctx.fillStyle = "#34495e";
            ctx.fillRect(50, 200, canvas.width - 100, 30);
            
            const pct = tap.tapCount / tap.targetTap;
            ctx.fillStyle = "#ff9800";
            ctx.fillRect(50, 200, (canvas.width - 100) * Math.min(1, pct), 30);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px Arial";
            ctx.fillText("연타 횟수: " + (tap.tapCount) + " / " + (tap.targetTap), canvas.width / 2, 250);
            
            // 큰 연타 원형 버튼
            ctx.beginPath();
            ctx.arc(canvas.width / 2, 450, 80, 0, Math.PI * 2);
            ctx.fillStyle = "#e67e22";
            ctx.fill();
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#ffffff";
            ctx.stroke();
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 28px Arial";
            ctx.fillText("연타!!", canvas.width / 2, 460);
            
            if (gymState.timer <= 0) {
                if (tap.tapCount >= tap.targetTap) {
                    finishGymTraining(true);
                } else {
                    finishGymTraining(false);
                }
            }
        } else if (currentGymGame === 'RHYTHM') {
            gymState.timer--;
            ctx.fillText("음악 리듬에 맞춰 물방울 터치!", canvas.width / 2, 75);
            
            // 3개 레인 그리기
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 3;
            for (let i = 1; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 150, 100);
                ctx.lineTo(i * 150, 700);
                ctx.stroke();
            }
            
            // 판정 라인 그리기
            ctx.strokeStyle = "#00bcd4";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, 600);
            ctx.lineTo(canvas.width, 600);
            ctx.stroke();
            
            // 무작위 노트(물방울) 강하 관리
            if (gymState.timer % 60 === 0) {
                const lane = Math.floor(Math.random() * 3);
                gymState.elements.push({ lane: lane, y: 100, size: 20 });
            }
            
            // 노트 업데이트 및 그리기
            ctx.fillStyle = "#29b6f6";
            gymState.elements.forEach((note, idx) => {
                note.y += 4; // 내려오는 속도
                
                ctx.beginPath();
                ctx.arc(note.lane * 150 + 75, note.y, note.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();
            });
            
            // 화면 밖 나간 노트 삭제
            gymState.elements = gymState.elements.filter(n => n.y < 750);
            
            // 리듬 타겟 횟수 도달 판정
            if (gymState.score >= 12) {
                finishGymTraining(true);
            }
            if (gymState.timer <= 0 && gymState.score < 12) {
                finishGymTraining(false);
            }
            
            ctx.fillStyle = "#ffeb3b";
            ctx.font = "bold 16px Arial";
            ctx.fillText("퍼펙트 물방울: " + (gymState.score) + " / 12회", canvas.width / 2, 660);
        } else if (currentGymGame === 'MEMORY') {
            ctx.fillText("카드 뒤집어 같은 짝 맞추기", canvas.width / 2, 75);
            
            // 카드 그리기
            gymState.elements.forEach(card => {
                if (card.matched) {
                    ctx.fillStyle = "#27ae60";
                    ctx.fillRect(card.x, card.y, card.w, card.h);
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "30px Arial";
                    ctx.fillText(card.symbol, card.x + card.w/2, card.y + card.h/2 + 10);
                } else if (card.flipped) {
                    ctx.fillStyle = "#ecf0f1";
                    ctx.fillRect(card.x, card.y, card.w, card.h);
                    ctx.fillStyle = "#2c3e50";
                    ctx.font = "30px Arial";
                    ctx.fillText(card.symbol, card.x + card.w/2, card.y + card.h/2 + 10);
                } else {
                    ctx.fillStyle = "#2c3e50";
                    ctx.fillRect(card.x, card.y, card.w, card.h);
                    ctx.strokeStyle = "#7f8c8d";
                    ctx.lineWidth = 3;
                    ctx.strokeRect(card.x, card.y, card.w, card.h);
                    ctx.fillStyle = "#7f8c8d";
                    ctx.font = "30px Arial";
                    ctx.fillText("?", card.x + card.w/2, card.y + card.h/2 + 10);
                }
            });
            
            // 모두 맞췄는지 판정
            const allMatched = gymState.elements.every(c => c.matched);
            if (allMatched) {
                finishGymTraining(true);
            }
        }
    } else {
        // 결과 연출 대기 상태
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("훈련 완료!", canvas.width / 2, 350);
        ctx.fillText("아래 '나가기'를 눌러 복귀하세요.", canvas.width / 2, 400);
    }
}

// 체육관 터치 클릭 조작 감지
function handleGymTouchOrClick(x, y) {
    if (gymState.gameState !== "PLAYING") return;
    
    if (currentGymGame === 'BOXING') {
        const target = gymState.elements[0];
        if (target) {
            const dist = Math.hypot(x - target.x, y - target.y);
            if (dist <= target.radius) {
                gymState.score++;
                sfx.playCoin(); // 피드백 효과음
                if (gymState.score >= 10) {
                    finishGymTraining(true);
                } else {
                    spawnPunchingTarget();
                }
            }
        }
    } else if (currentGymGame === 'LIFTING') {
        const bar = gymState.elements[0];
        // 드래그 시작 감지
        const dist = Math.hypot(x - bar.x, y - bar.y);
        if (dist < 60) {
            bar.isDragging = true;
        }
    } else if (currentGymGame === 'RUNNING') {
        const m = gymState.elements;
        // 출발점 터치 시 시작
        const dist = Math.hypot(x - m.startX, y - m.startY);
        if (dist < 30) {
            m.started = true;
        }
    } else if (currentGymGame === 'REACTION') {
        const rx = gymState.elements;
        if (rx.status === 'RED') {
            // 조기 터치 패널티
            rx.nextChange = Date.now() + 2000 + Math.random() * 3000;
            alert("조기 출발! 빨간불에는 대기해야 합니다!");
        } else if (rx.status === 'GREEN') {
            rx.clickTime = Date.now();
            const delay = rx.clickTime - rx.startTime;
            if (delay < 450) {
                finishGymTraining(true);
            } else {
                alert("반응 속도(" + (delay) + "ms)가 너무 느립니다! 450ms 이하를 노려보세요!");
                startGymTraining('REACTION'); // 재도전
            }
        }
    } else if (currentGymGame === 'MASH') {
        const tap = gymState.elements;
        // 마킹 원형 버튼 터치 여부 판단
        const dist = Math.hypot(x - canvas.width / 2, y - 450);
        if (dist <= 80) {
            tap.tapCount++;
            if (tap.tapCount >= tap.targetTap) {
                finishGymTraining(true);
            }
        }
    } else if (currentGymGame === 'RHYTHM') {
        // 하단 판정선(600) 근처 탭 감지
        if (y >= 540 && y <= 660) {
            // 어느 라인인지 판정
            const tapLane = Math.floor(x / 150);
            
            // 해당 라인 물방울이 판정선(600) 근처에 있는지 검출
            let success = false;
            gymState.elements.forEach(n => {
                if (n.lane === tapLane && Math.abs(n.y - 600) < 50) {
                    success = true;
                    n.y = 999; // 판정 완료 표시
                }
            });
            
            if (success) {
                gymState.score++;
                sfx.playCoin(); // 리듬 히트 효과음
                triggerFeedback("🎵 PERFECT!");
            }
        }
    } else if (currentGymGame === 'MEMORY') {
        gymState.elements.forEach(card => {
            if (!card.flipped && !card.matched && gymState.selectedCards.length < 2) {
                // 터치 바운딩 박스
                if (x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h) {
                    card.flipped = true;
                    gymState.selectedCards.push(card);
                    sfx.playTick(); // 뒤집기 소리
                    
                    if (gymState.selectedCards.length === 2) {
                        // 짝맞추기 검사
                        const card1 = gymState.selectedCards[0];
                        const card2 = gymState.selectedCards[1];
                        
                        if (card1.symbol === card2.symbol) {
                            card1.matched = true;
                            card2.matched = true;
                            gymState.selectedCards = [];
                            sfx.playCoin(); // 매칭 성공음
                        } else {
                            setTimeout(() => {
                                card1.flipped = false;
                                card2.flipped = false;
                                gymState.selectedCards = [];
                                sfx.playFailure(); // 오답 처짐음
                            }, 800);
                        }
                    }
                }
            }
        });
    }
}

// 드래그 조작 감지
function handleGymDrag(x, y) {
    if (gymState.gameState !== "PLAYING") return;
    
    if (currentGymGame === 'LIFTING') {
        const bar = gymState.elements[0];
        if (bar.isDragging) {
            bar.y = y;
            if (bar.y < bar.targetY) {
                // 1회 들어올리기 완료
                bar.isDragging = false;
                bar.y = bar.startY;
                gymState.score++;
                if (gymState.score >= gymState.targetCount) {
                    finishGymTraining(true);
                }
            }
        }
    } else if (currentGymGame === 'RUNNING') {
        const m = gymState.elements;
        if (m.started) {
            // 벽(흰 도로 밖) 닿았는지 판정
            if (!isPointInRunningMaze(x, y)) {
                m.started = false;
                alert("코스 이탈! 벽에 부딪혔습니다. 처음부터 다시 가야 합니다!");
                createRunningMaze();
                return;
            }
            
            // 종료점(END) 도달 검출
            const distToEnd = Math.hypot(x - m.endX, y - m.endY);
            if (distToEnd < 25) {
                m.started = false;
                finishGymTraining(true);
            }
        }
    }
}

function handleGymDragEnd() {
    if (currentGymGame === 'LIFTING' && gymState.elements[0]) {
        const bar = gymState.elements[0];
        bar.isDragging = false;
        bar.y = bar.startY; // 드롭 시 제자리로 복구
    }
}


// ==========================================
// --- 10단계 세로 수영 레이스 물리 엔진 ---
// ==========================================

let raceState = {
    distance: 0,
    targetDistance: 1500, // 완주 거리 기본값
    playerLane: 1, // 0~3 레인
    playerX: 0,
    playerY: 650,
    playerSpeed: 0,
    spurtCharges: 3,
    spurtTimer: 0,
    spurtGauge: 0, // 0~100 스퍼트 게이지
    swimStyle: 'freestyle', // 'freestyle', 'butterfly', 'backstroke'
    rhythmBubble: { active: false, x: 0, y: 0, timer: 0, cooldown: 120 },
    quickEvent: { active: false, triggered: false, type: 'mash', timer: 0, count: 0, shells: [] },
    rainbowParticles: [],
    obstacles: [],
    gifts: [],
    competitors: [],
    raceResults: null,
    backgroundScrollY: 0
};

// 대회 단계별 이름, 완주거리, 경쟁 난이도 정의 (약 20~25초의 스피디한 경기 시간)
const stageDetails = {
    1: { name: "유치원 수영교실", bg: "bg_water", distance: 1200, lanes: 3, npcCount: 3, obstacleRate: 0, npcSpeedMin: 2.3, npcSpeedMax: 2.8 },
    2: { name: "동네 수영장 대회", bg: "bg_water", distance: 1300, lanes: 3, npcCount: 4, obstacleRate: 0.015, npcSpeedMin: 2.5, npcSpeedMax: 3.0 },
    3: { name: "학교 수영 대회", bg: "bg_water", distance: 1400, lanes: 3, npcCount: 4, obstacleRate: 0.025, npcSpeedMin: 2.7, npcSpeedMax: 3.2 },
    4: { name: "구(區) 체육대회", bg: "bg_water", distance: 1500, lanes: 4, npcCount: 5, obstacleRate: 0.035, npcSpeedMin: 2.9, npcSpeedMax: 3.4 },
    5: { name: "호수 수영 대회", bg: "bg_lake", distance: 1600, lanes: 4, npcCount: 5, obstacleRate: 0.04, npcSpeedMin: 3.1, npcSpeedMax: 3.7 },
    6: { name: "강변 수영 대회", bg: "bg_river", distance: 1700, lanes: 4, npcCount: 5, obstacleRate: 0.045, npcSpeedMin: 3.3, npcSpeedMax: 4.0 },
    7: { name: "급류 수영 대회", bg: "bg_river", distance: 1800, lanes: 4, npcCount: 6, obstacleRate: 0.05, npcSpeedMin: 3.6, npcSpeedMax: 4.4 },
    8: { name: "해변 수영 대회", bg: "bg_beach_ocean", distance: 1900, lanes: 4, npcCount: 6, obstacleRate: 0.055, npcSpeedMin: 3.9, npcSpeedMax: 4.8 },
    9: { name: "암초 수영 대회", bg: "bg_ocean", distance: 2000, lanes: 4, npcCount: 7, obstacleRate: 0.06, npcSpeedMin: 4.2, npcSpeedMax: 5.2 },
    10: { name: "대양 챔피언십", bg: "bg_ocean", distance: 2200, lanes: 4, npcCount: 7, obstacleRate: 0.07, npcSpeedMin: 4.5, npcSpeedMax: 5.6 }
};

const npcNames = ["민우", "서준", "민준", "도윤", "예준", "시우", "하준", "지호", "우진"];

function startSwimmingRace(stageNum) {
    hideAllUIs();
    gameState = 'SWIMMING_RACE';
    currentRaceStage = stageNum;
    
    const details = stageDetails[stageNum];
    
    raceState.distance = 0;
    raceState.targetDistance = details.distance || 1500;
    raceState.playerLane = 1;
    raceState.playerX = getLaneCenterX(1, details.lanes);
    raceState.playerY = 650;
    raceState.playerSpeed = 0;
    raceState.slowTimer = 0;
    
    // 신규 게임플레이 요소 초기화
    raceState.spurtGauge = 0;
    raceState.swimStyle = 'freestyle';
    raceState.rhythmBubble = { active: false, x: 0, y: 0, timer: 0, cooldown: 90 };
    raceState.quickEvent = { active: false, triggered: false, type: 'mash', timer: 0, count: 0, shells: [] };
    raceState.rainbowParticles = [];
    
    // 드링크류 버프 적용 후 스퍼트 충전 횟수 추가
    raceState.spurtCharges = 3 + player.spurtExtraCharge;
    player.spurtExtraCharge = 0; // 버프 소진
    
    raceState.spurtTimer = 0;
    raceState.obstacles = [];
    raceState.gifts = [];
    raceState.backgroundScrollY = 0;
    raceState.raceResults = null;
    raceState.playerAnimFrame = 0; // 플레이어 애니메이션 전용 프레임
    
    // NPC들 생성 (스타트 라인에 자연스럽게 정렬)
    raceState.competitors = [];
    for (let i = 0; i < details.npcCount; i++) {
        const npcLane = i % details.lanes;
        const name = npcNames[i % npcNames.length];
        const baseSpeed = details.npcSpeedMin + Math.random() * (details.npcSpeedMax - details.npcSpeedMin);
        
        raceState.competitors.push({
            name: name,
            lane: npcLane,
            x: getLaneCenterX(npcLane, details.lanes),
            y: 650 - (i * 25 - (details.npcCount * 10)), // 초기 스타트라인 정렬
            baseSpeed: baseSpeed,
            currentSpeed: baseSpeed,
            animFrame: 0,
            color: "hsl(" + (i * 60) + ", 70%, 60%)"
        });
    }
}

// 각 레인 중심 X축 좌표 계산
function getLaneCenterX(laneIdx, totalLanes) {
    const laneWidth = canvas.width / totalLanes;
    return laneWidth * laneIdx + laneWidth / 2;
}

// 피격 등 충격 효과로 깜빡임 연출
let isInvulnerable = false;
let invulnerableTimer = 0;

function updateRaceLogic() {
    if (raceState.raceResults) return; // 골인 연출 중
    
    const details = stageDetails[currentRaceStage];
    
    // 영법 스타일별 효과 계산 (자유형 / 접영 / 배형)
    let styleSpeedBonus = 0;
    if (raceState.swimStyle === 'butterfly') {
        // 접영: 폭발적 파워 속도 +1.6! (스퍼트 게이지 지속 소모)
        styleSpeedBonus = 1.6;
        if (raceState.spurtGauge > 0) {
            raceState.spurtGauge -= 0.25;
        } else {
            raceState.swimStyle = 'freestyle';
            triggerFeedback("🏊 스퍼트 게이지 소진! 자유형으로 자동 전환되었습니다.");
        }
    } else if (raceState.swimStyle === 'backstroke') {
        // 배형: 선물 상자 및 코인 자석 자동 흡수
        raceState.gifts.forEach(gift => {
            if (Math.abs(gift.x - raceState.playerX) < 150 && gift.y < raceState.playerY) {
                gift.x += (raceState.playerX - gift.x) * 0.12;
            }
        });
    }
    
    // 1. 플레이어 수영 속도 업데이트 (기본 스탯 비례 + 영법 보너스)
    let targetSpeed = 3.2 + (player.speed * 0.12) + styleSpeedBonus;
    
    // 단백질/에너지 드링크 영구/소모 버프가 있으면 추가 속도 적용
    if (player.energyDrinkBoost > 0) {
        targetSpeed += 0.8;
    }
    
    // 장애물 충돌 감속 타이머 처리 (0.5초간 속도 감속)
    if (raceState.slowTimer > 0) {
        targetSpeed *= 0.7; // 30% 감속
        raceState.slowTimer--;
    }
    
    // 스퍼트 가속 효과
    if (raceState.spurtTimer > 0) {
        targetSpeed += 4.5;
        raceState.spurtTimer--;
        
        // 무지개 파티클 생성
        if (Math.random() < 0.6) {
            raceState.rainbowParticles.push({
                x: raceState.playerX + (Math.random() * 30 - 15),
                y: raceState.playerY + 20,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 4 + 2,
                color: "hsl(" + (Math.random() * 360) + ", 100%, 65%)",
                life: 25
            });
        }
    }
    
    // 무지개 파티클 라이프타임 업데이트
    raceState.rainbowParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
    });
    raceState.rainbowParticles = raceState.rainbowParticles.filter(p => p.life > 0);
    
    raceState.playerSpeed = targetSpeed;
    raceState.distance += raceState.playerSpeed * 0.3; // 진행 거리 누적
    raceState.playerAnimFrame += raceState.playerSpeed * 2.0; // 속도 비례 프레임 가속
    
    // 2. 레인 좌표 보간 (부드러운 좌우 롤링)
    const targetX = getLaneCenterX(raceState.playerLane, details.lanes);
    raceState.playerX += (targetX - raceState.playerX) * 0.15;
    
    // 3. 무한 스크롤 배경 업데이트 (수영 속도 비례)
    raceState.backgroundScrollY += raceState.playerSpeed;
    if (raceState.backgroundScrollY >= canvas.height) {
        raceState.backgroundScrollY = 0;
    }
    
    // 무적 상태 관리
    if (isInvulnerable) {
        invulnerableTimer--;
        if (invulnerableTimer <= 0) {
            isInvulnerable = false;
        }
    }
    
    // 리듬 물방울 과녁 스폰 & 타이머 관리
    if (!raceState.rhythmBubble.active && !raceState.quickEvent.active) {
        raceState.rhythmBubble.cooldown--;
        if (raceState.rhythmBubble.cooldown <= 0) {
            raceState.rhythmBubble.active = true;
            raceState.rhythmBubble.timer = 120; // 2초 노출
            raceState.rhythmBubble.x = raceState.playerX + (Math.random() * 60 - 30);
            raceState.rhythmBubble.y = raceState.playerY - 85;
            raceState.rhythmBubble.cooldown = 150; // 다음 스폰 2.5초 후
        }
    } else if (raceState.rhythmBubble.active) {
        raceState.rhythmBubble.timer--;
        if (raceState.rhythmBubble.timer <= 0) {
            raceState.rhythmBubble.active = false;
        }
    }
    
    // 3초 퀵 미니 이벤트 (진행률 45% 시점 발동)
    if (!raceState.quickEvent.triggered && raceState.distance >= raceState.targetDistance * 0.45) {
        raceState.quickEvent.triggered = true;
        raceState.quickEvent.active = true;
        raceState.quickEvent.timer = 180; // 3초 (180프레임)
        raceState.quickEvent.count = 0;
        raceState.quickEvent.type = Math.random() < 0.5 ? 'mash' : 'shell';
        if (raceState.quickEvent.type === 'shell') {
            raceState.quickEvent.shells = [
                { x: 90 + Math.random() * 60, y: 320 + Math.random() * 80, hit: false },
                { x: 190 + Math.random() * 60, y: 320 + Math.random() * 80, hit: false },
                { x: 290 + Math.random() * 60, y: 320 + Math.random() * 80, hit: false }
            ];
        }
        sfx.playVictory();
    }
    
    if (raceState.quickEvent.active) {
        raceState.quickEvent.timer--;
        if (raceState.quickEvent.timer <= 0) {
            raceState.quickEvent.active = false;
            if (raceState.quickEvent.type === 'mash') {
                const count = raceState.quickEvent.count;
                raceState.spurtTimer = 120; // 가속 2초
                raceState.spurtGauge = Math.min(100, raceState.spurtGauge + 30);
                triggerFeedback("🔥 3초 연타 완료! (" + count + "타) 챔피언 가속 부스트!");
            } else {
                const hitCount = raceState.quickEvent.shells.filter(s => s.hit).length;
                if (hitCount >= 3) {
                    raceState.spurtTimer = 150;
                    player.coins += 30;
                    savePlayerData();
                    triggerFeedback("🎯 황금 조개 퍼펙트! +30 코인 & 울트라 부스트!");
                } else {
                    player.coins += hitCount * 10;
                    savePlayerData();
                    triggerFeedback("🎯 조개 " + hitCount + "개 터트림! +" + (hitCount * 10) + " 코인");
                }
            }
        }
    }
    
    // 4. 장애물 하강 및 생성 로직
    if (Math.random() < details.obstacleRate) {
        const spawnLane = Math.floor(Math.random() * details.lanes);
        const symbols = ['obs_beachball', 'obs_log', 'obs_rock'];
        const chosen = symbols[Math.floor(Math.random() * symbols.length)];
        
        raceState.obstacles.push({
            symbol: chosen,
            lane: spawnLane,
            x: getLaneCenterX(spawnLane, details.lanes),
            y: 0,
            size: 25
        });
    }
    
    // 보물 상자 랜덤 스폰
    if (Math.random() < 0.005) {
        const spawnLane = Math.floor(Math.random() * details.lanes);
        raceState.gifts.push({
            lane: spawnLane,
            x: getLaneCenterX(spawnLane, details.lanes),
            y: 0,
            size: 20
        });
    }
    
    // 장애물 이동 및 충돌
    raceState.obstacles.forEach(obs => {
        obs.y += raceState.playerSpeed * 0.6; // 플레이어 상대적 속도로 통과
        
        // 충돌 검사 (배형 영법은 장애물 충돌 무시!)
        if (raceState.swimStyle !== 'backstroke' && !isInvulnerable && Math.abs(obs.x - raceState.playerX) < 35 && Math.abs(obs.y - raceState.playerY) < 40) {
            // 충돌 시 감속 및 무적 부여
            isInvulnerable = true;
            invulnerableTimer = 60;
            raceState.spurtTimer = 0;
            raceState.slowTimer = 30; // 0.5초(30프레임) 동안 감속
            sfx.playCollision(); // 부딪힘 소리
            
            // 집중력 장착 템이 있으면 부딪혀도 덜 튕김
            if (player.equippedGear.includes("goggles")) {
                invulnerableTimer = 40;
                raceState.slowTimer = 15;
            }
            triggerFeedback("💥 장애물 충돌! 속도가 느려집니다!");
        }
    });
    
    // 선물 상자 획득 검사
    raceState.gifts.forEach(gift => {
        gift.y += raceState.playerSpeed * 0.6;
        if (Math.abs(gift.x - raceState.playerX) < 35 && Math.abs(gift.y - raceState.playerY) < 40) {
            gift.y = 9999; // 획득 처리
            player.coins += 10;
            savePlayerData();
            sfx.playCoin(); // 코인 소리
            triggerFeedback("🎁 보물상자 획득! +10 코인");
        }
    });
    
    // 범위를 완전히 벗어난 장애물 제거
    raceState.obstacles = raceState.obstacles.filter(o => o.y < canvas.height + 50);
    raceState.gifts = raceState.gifts.filter(g => g.y < canvas.height + 50);
    
    // 5. NPC 움직임 업데이트 (엎치락뒤치락 접전 물리 엔진)
    const now = Date.now();
    raceState.competitors.forEach((npc, idx) => {
        // 주기적 페이스 변화 (사인파 효과로 엎치락뒤치락 연출)
        const wave = Math.sin(now * 0.003 + idx * 1.5) * 0.45;
        npc.currentSpeed = npc.baseSpeed + wave;
        
        // 플레이어와의 상대 속도 차이에 따라 부드럽게 위치 이동
        const speedDiff = raceState.playerSpeed - npc.currentSpeed;
        npc.y += speedDiff * 0.15;
        npc.animFrame += npc.currentSpeed * 2.0; // 개별 속도 비례 발차기 프레임
        
        // 화면 시야 범위(160~680) 안에서 자연스러운 접전을 보장하는 가속/감속 탄력 조절
        if (npc.y < 160) {
            npc.y = 160;
            npc.baseSpeed *= 0.98; // 너무 독주하면 체력 소진 감속
        }
        if (npc.y > 680) {
            npc.y = 680;
            npc.baseSpeed *= 1.02; // 뒤로 쳐지면 추격 스퍼트
        }
    });
    
    // 6. 결승골 검사
    if (raceState.distance >= raceState.targetDistance) {
        // 순위 결정
        let rank = 1;
        raceState.competitors.forEach(npc => {
            // NPC의 y좌표가 플레이어보다 위(y값이 더 작음)에 있으면 NPC가 더 앞선 것
            if (npc.y < raceState.playerY) {
                rank++;
            }
        });
        
        // 최종 보상 지급
        let prize = 20;
        if (rank === 1) prize = 100;
        else if (rank === 2) prize = 80;
        else if (rank === 3) prize = 50;
        
        player.coins += prize;
        
        // 에너지 보충제 소진
        if (player.energyDrinkBoost > 0) {
            player.energyDrinkBoost = 0;
        }
        
        if (rank === 1 && currentRaceStage === player.unlockedStage) {
            player.unlockedStage = Math.min(10, player.unlockedStage + 1);
        }
        
        savePlayerData();
        
        if (rank === 1) {
            sfx.playVictory(); // 우승 팡파레
        } else {
            sfx.playFailure(); // 실패 뚱 소리
        }
        
        raceState.raceResults = { rank: rank, prize: prize };
    }
}

// 통합 레이스 터치/클릭 처리 함수
function handleRaceClick(clickX, clickY) {
    if (gameState !== 'SWIMMING_RACE' || raceState.raceResults) return;
    
    // 1. 하단 영법 스위치 바 클릭 감지 (Y >= 660)
    if (clickY >= 660) {
        if (clickX < canvas.width / 3) {
            raceState.swimStyle = 'freestyle';
            sfx.playSplash();
            triggerFeedback("🏊 자유형 전환! (기본 속도)");
        } else if (clickX >= canvas.width / 3 && clickX < (canvas.width * 2) / 3) {
            if (raceState.spurtGauge > 0) {
                raceState.swimStyle = 'butterfly';
                sfx.playSpurt();
                triggerFeedback("🦋 접영 파워 전환! (속도+1.6 폭발 가속)");
            } else {
                triggerFeedback("⚠️ 스퍼트 게이지가 부족합니다!");
            }
        } else {
            raceState.swimStyle = 'backstroke';
            sfx.playSplash();
            triggerFeedback("🏊‍♀️ 배형 전환! (장애물 무적 + 코인 자석)");
        }
        return;
    }
    
    // 2. 3초 퀵 미니 이벤트 터치 감지
    if (raceState.quickEvent.active) {
        if (raceState.quickEvent.type === 'mash') {
            raceState.quickEvent.count++;
            sfx.playCoin();
            return;
        } else if (raceState.quickEvent.type === 'shell') {
            raceState.quickEvent.shells.forEach(shell => {
                if (!shell.hit && Math.abs(shell.x - clickX) < 40 && Math.abs(shell.y - clickY) < 40) {
                    shell.hit = true;
                    sfx.playCoin();
                }
            });
            return;
        }
    }
    
    // 3. 리듬 물방울 과녁 터치 감지
    if (raceState.rhythmBubble.active) {
        const dist = Math.hypot(clickX - raceState.rhythmBubble.x, clickY - raceState.rhythmBubble.y);
        if (dist < 45) {
            raceState.rhythmBubble.active = false;
            raceState.spurtGauge = Math.min(100, raceState.spurtGauge + 25);
            sfx.playSplash();
            triggerFeedback("💦 PERFECT! +25% 스퍼트 게이지!");
            return;
        }
    }
    
    // 4. 일반 좌우 레인 이동 및 스퍼트 가속
    const details = stageDetails[currentRaceStage];
    if (clickX < canvas.width / 3) {
        if (raceState.playerLane > 0) {
            raceState.playerLane--;
            sfx.playSplash();
        }
    } else if (clickX > (canvas.width * 2) / 3) {
        if (raceState.playerLane < details.lanes - 1) {
            raceState.playerLane++;
            sfx.playSplash();
        }
    } else {
        triggerRaceSpurt();
    }
}

// 상대방 터치/드래그 방향 전환 감지
let raceDragStartX = 0;
canvas.addEventListener('touchstart', (e) => {
    if (gameState === 'SWIMMING_RACE' && e.touches.length > 0) {
        raceDragStartX = e.touches[0].clientX;
    }
});

canvas.addEventListener('touchend', (e) => {
    if (gameState === 'SWIMMING_RACE' && e.changedTouches.length > 0) {
        const diffX = e.changedTouches[0].clientX - raceDragStartX;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.changedTouches[0].clientX - rect.left;
        const clickY = e.changedTouches[0].clientY - rect.top;
        
        if (Math.abs(diffX) < 15) {
            handleRaceClick(clickX, clickY);
        } else {
            const details = stageDetails[currentRaceStage];
            if (diffX > 40) {
                if (raceState.playerLane < details.lanes - 1) {
                    raceState.playerLane++;
                    sfx.playSplash();
                }
            } else if (diffX < -40) {
                if (raceState.playerLane > 0) {
                    raceState.playerLane--;
                    sfx.playSplash();
                }
            }
        }
    }
});

// PC 조작용 클릭 및 마우스 스와이프
let mouseDragStartX = 0;
canvas.addEventListener('mousedown', (e) => {
    if (gameState === 'SWIMMING_RACE') {
        mouseDragStartX = e.clientX;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (gameState === 'SWIMMING_RACE') {
        const diffX = e.clientX - mouseDragStartX;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        if (Math.abs(diffX) < 15) {
            handleRaceClick(clickX, clickY);
        } else {
            const details = stageDetails[currentRaceStage];
            if (diffX > 40) {
                if (raceState.playerLane < details.lanes - 1) {
                    raceState.playerLane++;
                    sfx.playSplash();
                }
            } else if (diffX < -40) {
                if (raceState.playerLane > 0) {
                    raceState.playerLane--;
                    sfx.playSplash();
                }
            }
        }
    }
});

// 키보드 방향키 조작 백업
window.addEventListener('keydown', (e) => {
    if (gameState === 'SWIMMING_RACE') {
        const details = stageDetails[currentRaceStage];
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            if (raceState.playerLane > 0) {
                raceState.playerLane--;
                sfx.playSplash();
            }
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            if (raceState.playerLane < details.lanes - 1) {
                raceState.playerLane++;
                sfx.playSplash();
            }
        } else if (e.key === ' ' || e.code === 'Space') {
            // 퀵 이벤트 중이면 연타 처리
            if (raceState.quickEvent.active && raceState.quickEvent.type === 'mash') {
                raceState.quickEvent.count++;
                sfx.playCoin();
            } else if (raceState.rhythmBubble.active) {
                // 리듬 과녁 활성화 시 타이밍 탭!
                raceState.rhythmBubble.active = false;
                raceState.spurtGauge = Math.min(100, raceState.spurtGauge + 25);
                sfx.playSplash();
                triggerFeedback("💦 PERFECT! +25% 스퍼트 게이지!");
            } else {
                triggerRaceSpurt();
            }
        }
    }
});

function triggerRaceSpurt() {
    if ((raceState.spurtGauge >= 100 || raceState.spurtCharges > 0) && raceState.spurtTimer <= 0) {
        if (raceState.spurtGauge >= 100) {
            raceState.spurtGauge = 0;
        } else {
            raceState.spurtCharges--;
        }
        raceState.spurtTimer = 180; // 3초 가속
        
        // 무지개 파티클 생성
        for (let i = 0; i < 25; i++) {
            raceState.rainbowParticles.push({
                x: raceState.playerX + (Math.random() * 40 - 20),
                y: raceState.playerY + (Math.random() * 20),
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 6 + 2,
                color: "hsl(" + (Math.random() * 360) + ", 100%, 60%)",
                life: 30
            });
        }
        sfx.playSpurt();
        triggerFeedback("🌈 무지개 슈퍼 스퍼트 발동! 슝~~~!");
    }
}

// 10단계 시각 외형 변화를 위한 인체 그리기 함수 (Voxel 리스킨 Fallback 대응)
function drawHuman(ctx, x, y, gender, lv, dir, animTime) {
    // 1. 구글 스티치 PNG 캐릭터 에셋 스프라이트 우선 렌더링
    let spriteLv = 1;
    if (lv >= 10) spriteLv = 10;
    else if (lv >= 7) spriteLv = 7;
    else if (lv >= 5) spriteLv = 5;
    else if (lv >= 3) spriteLv = 3;
    
    const imgKey = "char_" + (gender === 'boy' ? 'boy' : 'girl') + "_lv" + spriteLv;
    const img = images[imgKey];
    
    if (isAssetsLoaded && img && img.complete && img.naturalHeight > 0) {
        ctx.save();
        ctx.translate(x, y);
        
        // 레벨에 따른 키 1.0~1.2 스케일링
        const heightScale = 1.0 + (Math.min(10, lv) - 1) * 0.02;
        ctx.scale(1.0, heightScale);
        
        // 수영 스트로크 흔들림 효과
        if (animTime > 0) {
            const sway = Math.sin(animTime / 120) * 4;
            ctx.rotate(sway * Math.PI / 180);
        }
        
        const w = 75;
        const h = 105;
        ctx.drawImage(img, -w/2, -h/2 - 10, w, h);
        ctx.restore();
        return;
    }
    
    // 2. 에셋 미로드 시 캔버스 2D 도형 폴백 그리기
    ctx.save();
    ctx.translate(x, y);
    
    // 키 스케일링 (Lv.1: 100% ~ Lv.10: 120%)
    const heightScale = 1.0 + (lv - 1) * 0.022;
    ctx.scale(heightScale, heightScale);
    
    // 안색 색조 필터 (Lv.1 창백 -> Lv.10 건강한 구릿빛)
    let skinColor = "#fcd5b5"; // 기본 살구색
    if (lv <= 2) skinColor = "#fef0e3"; // 창백
    else if (lv >= 7) skinColor = "#d89667"; // 구릿빛
    else if (lv >= 4) skinColor = "#f1b88e"; // 살짝 탄 안색
    
    // 1. 머리카락 및 얼굴
    ctx.fillStyle = skinColor;
    
    // 몸통 너비 (근량 수치에 따른 상체 발달)
    const baseWidth = 24 + (lv - 1) * 1.5;
    const muscleBonus = (lv >= 5) ? 6 : 0;
    
    // 2. 수영복 바디 드로잉
    let suitColor = (gender === 'boy') ? '#2980b9' : '#8e44ad';
    if (lv >= 8) suitColor = '#111111'; // 프로 골드 레이싱 수영복
    else if (lv >= 4) suitColor = '#c0392b'; // 스포츠 수영복
    
    ctx.fillStyle = suitColor;
    ctx.fillRect(-(baseWidth/2), -30, baseWidth, 35);
    
    // 복근 선 표현 (Lv.5 이상)
    if (lv >= 5) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-4, -15); ctx.lineTo(4, -15);
        ctx.moveTo(-4, -5); ctx.lineTo(4, -5);
        ctx.stroke();
    }
    
    // 3. 수영 스트로크 어깨 팔 동작 (애니메이션)
    ctx.strokeStyle = skinColor;
    ctx.lineWidth = 6 + (lv * 0.4);
    ctx.lineCap = "round";
    
    // 왼팔
    ctx.beginPath();
    ctx.moveTo(-(baseWidth/2 + muscleBonus/2), -25);
    ctx.lineTo(-(baseWidth/2 + 10), -50 + Math.sin(animTime / 100) * 15);
    ctx.stroke();
    
    // 오른팔
    ctx.beginPath();
    ctx.moveTo(baseWidth/2 + muscleBonus/2, -25);
    ctx.lineTo(baseWidth/2 + 10, -50 - Math.sin(animTime / 100) * 15);
    ctx.stroke();
    
    // 4. 머리 및 수영모 드로잉
    ctx.beginPath();
    ctx.arc(0, -45, 16, 0, Math.PI * 2);
    ctx.fillStyle = skinColor;
    ctx.fill();
    
    // 수영모 모자 (장착 여부에 따라 렌더링)
    ctx.beginPath();
    ctx.arc(0, -48, 16, Math.PI, 0); // 머리 반만 덮음
    let capColor = (gender === 'boy') ? '#1e272e' : '#fbc02d';
    if (player.equippedGear.includes("cap")) capColor = '#e74c3c';
    ctx.fillStyle = capColor;
    ctx.fill();
    
    // 물안경 밴드 그리기 (장비 장착 시)
    if (player.equippedGear.includes("goggles")) {
        ctx.fillStyle = "#00bcd4";
        ctx.fillRect(-10, -48, 20, 6);
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(-10, -48, 20, 6);
    }
    
    // 골드 챔피언 오라 후광 (최종 Lv.10 전설 챔피언 전용 데코)
    if (lv >= 10) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ffeb3b";
        ctx.strokeStyle = "#ffeb3b";
        ctx.lineWidth = 3;
        ctx.strokeRect(-25, -65, 50, 110);
    }
    
    ctx.restore();
}

function drawSwimmingRace() {
    const details = stageDetails[currentRaceStage];
    
    // 1. 무한 스크롤 타일형 맵 배경 렌더링
    let bgImg = images.bg_water;
    if (details.bg === "bg_valley") bgImg = images.bg_valley;
    if (details.bg === "bg_ocean") bgImg = images.bg_ocean;
    
    if (isAssetsLoaded && bgImg && bgImg.complete && bgImg.naturalHeight > 0) {
        // 캔버스 세로방향으로 스크롤 타일링 2회 중첩
        ctx.drawImage(bgImg, 0, raceState.backgroundScrollY - canvas.height, canvas.width, canvas.height);
        ctx.drawImage(bgImg, 0, raceState.backgroundScrollY, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#2980b9";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 레인 구분선 렌더링 (실내 수영장용)
    if (details.bg === "bg_water") {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 15]);
        for (let i = 1; i < details.lanes; i++) {
            ctx.beginPath();
            ctx.moveTo((canvas.width / details.lanes) * i, 0);
            ctx.lineTo((canvas.width / details.lanes) * i, canvas.height);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }
    
    // 무지개 파티클 이펙트 드로잉
    raceState.rainbowParticles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // 2. 장애물 렌더링
    raceState.obstacles.forEach(obs => {
        let obsImg = images[obs.symbol];
        if (isAssetsLoaded && obsImg && obsImg.complete && obsImg.naturalHeight > 0) {
            ctx.drawImage(obsImg, obs.x - obs.size, obs.y - obs.size, obs.size * 2, obs.size * 2);
        } else {
            // 폴백 그리기
            ctx.fillStyle = "#e67e22";
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // 선물 상자 렌더링
    raceState.gifts.forEach(gift => {
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(gift.x - gift.size, gift.y - gift.size, gift.size * 2, gift.size * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(gift.x - gift.size, gift.y - gift.size, gift.size * 2, gift.size * 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Arial";
        ctx.fillText("🎁", gift.x, gift.y + 4);
    });
    
    // 3. NPC 렌더링 (이름표 동시 출력)
    raceState.competitors.forEach(npc => {
        drawHuman(ctx, npc.x, npc.y, 'boy', 4, 'up', Date.now() + npc.baseSpeed * 100);
        
        // NPC 이름 태그
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(npc.x - 25, npc.y + 35, 50, 16);
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(npc.name, npc.x, npc.y + 47);
    });
    
    // 4. 플레이어 캐릭터 그리기
    let shouldDraw = true;
    if (isInvulnerable && Math.floor(invulnerableTimer / 5) % 2 === 0) {
        shouldDraw = false;
    }
    if (shouldDraw) {
        drawHuman(ctx, raceState.playerX, raceState.playerY, player.gender, player.level, 'up', Date.now());
        
        // 플레이어 내이름 태그
        ctx.fillStyle = "rgba(46, 204, 113, 0.8)";
        ctx.fillRect(raceState.playerX - 25, raceState.playerY + 35, 50, 16);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("나", raceState.playerX, raceState.playerY + 47);
    }
    
    // 5. 리듬 물방울 과녁 렌더링
    if (raceState.rhythmBubble.active) {
        const pulse = 1.0 + Math.sin(Date.now() / 100) * 0.15;
        ctx.save();
        ctx.translate(raceState.rhythmBubble.x, raceState.rhythmBubble.y);
        ctx.scale(pulse, pulse);
        
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 188, 212, 0.85)";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.fillText("💦 TAP!", 0, 5);
        ctx.restore();
    }
    
    // 6. 3초 퀵 미니 이벤트 오버레이 (화면 중앙)
    if (raceState.quickEvent.active) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 110, canvas.width, 320);
        
        const secLeft = Math.ceil(raceState.quickEvent.timer / 60);
        ctx.fillStyle = "#ffeb3b";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.fillText("⚡ 3초 퀵 챌린지! (" + secLeft + "초)", canvas.width / 2, 150);
        
        if (raceState.quickEvent.type === 'mash') {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 18px Arial";
            ctx.fillText("🔥 화면을 마구 연타하세요!", canvas.width / 2, 195);
            ctx.font = "bold 45px Arial";
            ctx.fillStyle = "#ff5722";
            ctx.fillText(raceState.quickEvent.count + " 타!", canvas.width / 2, 270);
        } else {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 18px Arial";
            ctx.fillText("🎯 황금 조개를 재빨리 터트리세요!", canvas.width / 2, 190);
            
            raceState.quickEvent.shells.forEach(shell => {
                if (!shell.hit) {
                    ctx.beginPath();
                    ctx.arc(shell.x, shell.y, 25, 0, Math.PI * 2);
                    ctx.fillStyle = "#f1c40f";
                    ctx.fill();
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.fillStyle = "#ffffff";
                    ctx.font = "bold 16px Arial";
                    ctx.fillText("🐚", shell.x, shell.y + 6);
                }
            });
        }
    }
    
    // 7. 실시간 정보 헤더 레이아웃 (스퍼트 게이지 진행바)
    ctx.fillStyle = "rgba(13, 17, 23, 0.92)";
    ctx.fillRect(0, 0, canvas.width, 105);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "left";
    ctx.fillText("🏁 " + (details.name), 15, 25);
    
    // 스퍼트 게이지 바
    ctx.fillStyle = "#34495e";
    ctx.fillRect(15, 35, canvas.width - 30, 16);
    const gaugeFill = raceState.spurtGauge / 100;
    const gaugeColor = (raceState.spurtGauge >= 100) ? "#ffeb3b" : "#00bcd4";
    ctx.fillStyle = gaugeColor;
    ctx.fillRect(15, 35, (canvas.width - 30) * gaugeFill, 16);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    const gaugeText = (raceState.spurtGauge >= 100) ? "⚡ 100% 챔피언 스퍼트 준비 완료! (터치/Space)" : "⚡ 스퍼트 게이지: " + (Math.floor(raceState.spurtGauge)) + "%";
    ctx.fillText(gaugeText, canvas.width / 2, 48);
    
    // 거리 완주 진행률
    const progress = Math.min(1.0, raceState.distance / raceState.targetDistance);
    ctx.fillStyle = "#34495e";
    ctx.fillRect(15, 75, canvas.width - 30, 14);
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(15, 75, (canvas.width - 30) * progress, 14);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText("완주 거리 진행률: " + (Math.floor(progress * 100)) + "%", canvas.width / 2, 86);

    // 8. 하단 영법 컨트롤 바 렌더링 (Y: 660 ~ 725 위치로 위로 올려 짤림 방지!)
    if (!raceState.raceResults) {
        ctx.fillStyle = "rgba(20, 25, 35, 0.92)";
        ctx.fillRect(0, 660, canvas.width, 65);
        ctx.strokeStyle = "#37474f";
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 660, canvas.width, 65);
        
        const btnWidth = canvas.width / 3;
        const styles = [
            { id: 'freestyle', label: '🏊‍♂️ 자유형', desc: '기본속도' },
            { id: 'butterfly', label: '🦋 접영', desc: '속도+1.6' },
            { id: 'backstroke', label: '🏊‍♀️ 배형', desc: '무적+자석' }
        ];
        
        styles.forEach((st, idx) => {
            const bx = idx * btnWidth;
            const isSelected = (raceState.swimStyle === st.id);
            
            ctx.fillStyle = isSelected ? "#0288d1" : "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(bx + 4, 665, btnWidth - 8, 55);
            ctx.strokeStyle = isSelected ? "#ffeb3b" : "#546e7a";
            ctx.lineWidth = isSelected ? 2.5 : 1;
            ctx.strokeRect(bx + 4, 665, btnWidth - 8, 55);
            
            ctx.fillStyle = isSelected ? "#ffffff" : "#b0bec5";
            ctx.font = "bold 13px Arial";
            ctx.textAlign = "center";
            ctx.fillText(st.label, bx + btnWidth / 2, 687);
            ctx.font = "10px Arial";
            ctx.fillText(st.desc, bx + btnWidth / 2, 707);
        });
    }
    
    // 6. 경기 종료 결과창 디스플레이
    if (raceState.raceResults) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 100, canvas.width, canvas.height - 100);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px Arial";
        ctx.fillText("🏁 경기 종료!", canvas.width / 2, 300);
        
        let medal = "참가상 🥉";
        if (raceState.raceResults.rank === 1) medal = "우승 금메달 🥇";
        else if (raceState.raceResults.rank === 2) medal = "준우승 은메달 🥈";
        else if (raceState.raceResults.rank === 3) medal = "은메달 🥉";
        
        ctx.font = "bold 20px Arial";
        ctx.fillStyle = "#ffeb3b";
        ctx.fillText("최종 등수: " + (raceState.raceResults.rank) + "등 (" + (medal) + ")", canvas.width / 2, 360);
        ctx.fillText("보상: +" + (raceState.raceResults.prize) + " 코인", canvas.width / 2, 400);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Arial";
        if (raceState.raceResults.rank === 1) {
            ctx.fillText("축하합니다! 다음 단계 대회 해금 완료!", canvas.width / 2, 450);
        } else {
            ctx.fillText("다시 도전해 보세요! 훈련으로 몸을 더 키우면 1등 할 수 있어요!", canvas.width / 2, 450);
        }
        
        // 터치하여 나가기 가속 안내
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "#4caf50";
        ctx.fillText("👉 화면을 터치하면 로비로 복귀합니다", canvas.width / 2, 540);
    }
}

// 레이스 결과창 탭 감지하여 나가기 처리
canvas.addEventListener('click', () => {
    if (gameState === 'SWIMMING_RACE' && raceState.raceResults) {
        gameState = 'HUB_LOBBY';
        hideAllUIs();
        hubUi.style.display = 'flex';
        updateLobbyUI();
    }
});


// ==========================================
// --- 메인 애니메이션 루프 및 조작 입력 ---
// ==========================================

function update() {
    if (gameState === 'SWIMMING_RACE') {
        updateRaceLogic();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'GYM_TRAINING') {
        drawGymTraining();
    } else if (gameState === 'SWIMMING_RACE') {
        drawSwimmingRace();
    } else {
        // UI 로비 대시보드 뒷배경
        if (images.bg_gym && images.bg_gym.complete && images.bg_gym.naturalHeight > 0) {
            ctx.drawImage(images.bg_gym, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#1b2530";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // 로비에 실시간 캐릭터 피지컬 변화 애니메이션 렌더링!
        if (gameState === 'HUB_LOBBY') {
            // 화면 하단 중앙 부분에 스탠딩 캐릭터 그리기
            drawHuman(ctx, canvas.width / 2, 450, player.gender, player.level, 'down', Date.now());
        }
    }
    
    // 전역 피드백 알림 메세지 드로잉
    if (feedbackTimer > 0) {
        feedbackTimer--;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(30, 20, canvas.width - 60, 40);
        ctx.strokeStyle = "#4caf50";
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 20, canvas.width - 60, 40);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.fillText(showFeedbackMessage, canvas.width / 2, 45);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- 마우스 & 터치 이벤트 통합 매핑 (체육관 드래그 & 클릭 대응) ---
canvas.addEventListener('click', (e) => {
    if (gameState !== 'GYM_TRAINING') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleGymTouchOrClick(x, y);
});

canvas.addEventListener('mousemove', (e) => {
    if (gameState !== 'GYM_TRAINING') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    handleGymDrag(x, y);
});

canvas.addEventListener('mouseup', () => {
    if (gameState === 'GYM_TRAINING') {
        handleGymDragEnd();
    }
});

// 모바일 터치 대응
canvas.addEventListener('touchstart', (e) => {
    if (gameState !== 'GYM_TRAINING') return;
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        handleGymTouchOrClick(x, y);
    }
    // 스크롤 등 기본동작 차단
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (gameState !== 'GYM_TRAINING') return;
    if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        handleGymDrag(x, y);
    }
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => {
    if (gameState === 'GYM_TRAINING') {
        handleGymDragEnd();
    }
});


// ==========================================
// --- 모바일 가상 키패드 타이핑 리스너 ---
// ==========================================

const keysList = document.querySelectorAll('.key-btn');
keysList.forEach(keyBtn => {
    keyBtn.addEventListener('click', (e) => {
        const pressedKey = e.target.innerText.trim();
        
        if (pressedKey === 'ESC') {
            // 체육관 메뉴로 나가기
            gameState = 'GYM_SELECTION';
            hideAllUIs();
            gymUi.style.display = 'flex';
            keyboardPad.style.display = 'none';
            updateLobbyUI();
            return;
        }
        
        // 훈련 타이핑 처리
        handleVirtualKeyPress(pressedKey);
    });
});

// 가상 키보드 입력 핸들러
function handleVirtualKeyPress(key) {
    if (gameState !== 'GYM_TRAINING') return;
    
    if (currentGymGame === 'STRETCH') {
        if (key.toUpperCase() === gymState.inputPrompt) {
            gymState.score++;
            triggerFeedback("🧘 완벽한 자세!");
            if (gymState.score >= gymState.targetCount) {
                finishGymTraining(true);
            } else {
                spawnStretchKey();
            }
        }
    } else if (currentGymGame === 'ROPE') {
        const targetWord = gymState.inputPrompt;
        const nextCharExpected = targetWord.charAt(gymState.inputText.length);
        
        if (key.toUpperCase() === nextCharExpected) {
            gymState.inputText += key.toUpperCase();
            if (gymState.inputText === targetWord) {
                gymState.score++;
                triggerFeedback("🪢 줄넘기 연속 홉!");
                if (gymState.score >= gymState.targetCount) {
                    finishGymTraining(true);
                } else {
                    spawnRopeWord();
                }
            }
        }
    } else if (currentGymGame === 'FORM') {
        const targetSentence = gymState.inputPrompt;
        const nextCharExpected = targetSentence.charAt(gymState.inputText.length);
        
        // 모바일 스크린 가상키보드에는 띄어쓰기 처리를 위해 특수 입력 또는 그냥 자동 스킵 처리 지원 가능
        // 훈련 문장의 공백 문자 처리 (만약 다음 문자가 공백이면 자동 스킵 처리하여 가독성 높임)
        if (nextCharExpected === ' ') {
            gymState.inputText += ' ';
        }
        
        const nextCharExpectedAfterSpace = targetSentence.charAt(gymState.inputText.length);
        if (key.toUpperCase() === nextCharExpectedAfterSpace) {
            gymState.inputText += key.toUpperCase();
            if (gymState.inputText === targetSentence) {
                gymState.score++;
                triggerFeedback("🏊 좋은 수영 폼 연습 완료!");
                if (gymState.score >= gymState.targetCount) {
                    finishGymTraining(true);
                } else {
                    spawnFormSentence();
                }
            }
        }
    }
}

// 실제 하드웨어 키보드 입력 매핑 지원
window.addEventListener('keydown', (e) => {
    if (gameState !== 'GYM_TRAINING') return;
    
    // ESC 키 대응
    if (e.key === 'Escape') {
        gameState = 'GYM_SELECTION';
        hideAllUIs();
        gymUi.style.display = 'flex';
        keyboardPad.style.display = 'none';
        updateLobbyUI();
        return;
    }
    
    const key = e.key.toUpperCase();
    
    // 띄어쓰기 공백 입력 수영 폼 대응
    if (e.code === 'Space') {
        handleVirtualKeyPress(' ');
        return;
    }
    
    if (alphabetKeys.includes(key)) {
        handleVirtualKeyPress(key);
    }
});


// ==========================================
// --- 반응속도 및 미니게임 루프 추가 스케줄러 ---
// ==========================================

setInterval(() => {
    if (gameState === 'GYM_TRAINING' && currentGymGame === 'REACTION') {
        const rx = gymState.elements;
        if (rx.status === 'RED' && Date.now() >= rx.nextChange) {
            rx.status = 'GREEN';
            rx.startTime = Date.now();
        }
    }
}, 50);


// --- 초기화 시동 ---
initPlayerData();
gameLoop();
