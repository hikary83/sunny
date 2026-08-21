// 🎵 수영 챔피언: 8비트 레트로 사운드 신디사이저 (Web Audio API)

class SoundEffects {
    constructor() {
        this.ctx = null;
        this.bgmInterval = null;
        this.isBgmPlaying = false;
        this.muted = false;
        this.bgmTempo = 250; // BPM 120 (500ms) or 250ms per step
    }

    // 오디오 컨텍스트 지연 로드 (유저 브라우저 상호작용 이벤트 직후 기동)
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 기본 단일 음 합성 생성기
    playTone(freq, type, duration, volume = 0.1) {
        this.init();
        if (this.muted || !this.ctx) return;
        
        // 모바일 사파리 등 오디오 일시 정지 대응
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        // 부드러운 감쇠 페이드 아웃 연출
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // 1. 버튼 클릭 효과음 (틱!)
    playTick() {
        this.playTone(600, "sine", 0.04, 0.05);
    }

    // 2. 동전 코인 먹을 때 (띠링!)
    playCoin() {
        this.playTone(523.25, "sine", 0.08, 0.1); // C5
        setTimeout(() => {
            this.playTone(783.99, "sine", 0.15, 0.1); // G5
        }, 70);
    }

    // 3. 물결 헤엄치는 소리 (찹!)
    playSplash() {
        this.playTone(200, "triangle", 0.06, 0.07);
    }

    // 4. 장애물 쿵! 충돌 (피격음)
    playCollision() {
        this.playTone(100, "sawtooth", 0.25, 0.2);
        this.playTone(70, "triangle", 0.2, 0.15);
    }

    // 5. 번개 스퍼트 발동 (피유우웅 주파수 상승 램프)
    playSpurt() {
        this.init();
        if (this.muted || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.25);
        
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    // 6. 우승 승리 나팔 (빰빰빰빰~ 팡파레)
    playVictory() {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, "sine", 0.3, 0.12);
            }, idx * 120);
        });
    }

    // 7. 실패 축처진 톤 (뚱~ 뚜두둥)
    playFailure() {
        const notes = [392.00, 349.23, 311.13, 220.00]; // G4, F4, Eb4, A3
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, "triangle", 0.4, 0.12);
            }, idx * 150);
        });
    }

    // 8. 레트로 백그라운드 멜로디 루프 (BGM)
    startBgm() {
        if (this.isBgmPlaying) return;
        this.init();
        this.isBgmPlaying = true;

        // 경쾌한 4마디 루프 멜로디 시퀀스
        const melody = [
            261.63, 329.63, 392.00, 329.63, // C4 E4 G4 E4
            293.66, 349.23, 440.00, 349.23, // D4 F4 A4 F4
            329.63, 392.00, 493.88, 392.00, // E4 G4 B4 G4
            349.23, 440.00, 523.25, 440.00  // F4 A4 C5 A4
        ];
        
        let step = 0;
        this.bgmInterval = setInterval(() => {
            if (this.muted) return;
            const freq = melody[step % melody.length];
            // 메인 선율은 부드러운 사인파로 재생해 고막 피로 방지
            this.playTone(freq, "sine", 0.22, 0.03);
            step++;
        }, 300);
    }

    stopBgm() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        this.isBgmPlaying = false;
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBgm();
        } else {
            this.startBgm();
        }
        return this.muted;
    }
}

// 전역 싱글톤 인스턴스 노출
const sfx = new SoundEffects();
