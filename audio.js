
// Cyber-Strike: Transformers - Web Audio Procedural Sound Engine
// Completely zero-asset, zero-lag, synthesized audio

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.engineOsc = null;
        this.engineGain = null;
        this.nitroGain = null;
        this.isEngineRunning = false;
        this.muted = false;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
    }

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createNoiseBuffer(duration = 0.5) {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playRifleShot() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        // Punchy body oscillator
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

        oscGain.gain.setValueAtTime(0.8, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.13);

        // Crack noise burst
        const noiseBuffer = this.createNoiseBuffer(0.18);
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, t);
        filter.frequency.exponentialRampToValueAtTime(600, t + 0.18);
        filter.Q.value = 3;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.9, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
        noise.stop(t + 0.19);
    }

    playSniperShot() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        // Heavy sub-bass blast (AWP thunder)
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(180, t);
        sub.frequency.exponentialRampToValueAtTime(25, t + 0.45);

        subGain.gain.setValueAtTime(1.0, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.46);

        // Sonic crack noise
        const noiseBuffer = this.createNoiseBuffer(0.5);
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4500, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.5);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.0, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
        noise.stop(t + 0.51);
    }

    playKnifeSlash() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.2);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(3200, t + 0.1);
        filter.frequency.exponentialRampToValueAtTime(500, t + 0.2);
        filter.Q.value = 6;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        noise.stop(t + 0.21);
    }

    // Iconic Transformer transformation sequence sound: "Tch-ch-ch-chk-clank"
    playTransform() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const steps = [
            { freq1: 180, freq2: 440, time: 0.00, dur: 0.12 },
            { freq1: 260, freq2: 620, time: 0.10, dur: 0.13 },
            { freq1: 400, freq2: 880, time: 0.20, dur: 0.14 },
            { freq1: 520, freq2: 1100, time: 0.32, dur: 0.15 },
            { freq1: 300, freq2: 750, time: 0.45, dur: 0.20 }
        ];

        steps.forEach((step) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = t + step.time;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(step.freq1, start);
            osc.frequency.exponentialRampToValueAtTime(step.freq2, start + step.dur * 0.8);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(step.freq2, start);
            filter.Q.value = 8;

            gain.gain.setValueAtTime(0.01, start);
            gain.gain.linearRampToValueAtTime(0.4, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, start + step.dur);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(start);
            osc.stop(start + step.dur);
        });

        // Heavy mechanical locking clank at the end
        const clankTime = t + 0.55;
        const clankOsc = this.ctx.createOscillator();
        const clankGain = this.ctx.createGain();
        clankOsc.type = 'square';
        clankOsc.frequency.setValueAtTime(120, clankTime);
        clankOsc.frequency.exponentialRampToValueAtTime(40, clankTime + 0.15);

        clankGain.gain.setValueAtTime(0.8, clankTime);
        clankGain.gain.exponentialRampToValueAtTime(0.001, clankTime + 0.2);

        clankOsc.connect(clankGain);
        clankGain.connect(this.masterGain);
        clankOsc.start(clankTime);
        clankOsc.stop(clankTime + 0.21);
    }

    // Vehicle engine rumble (dynamic pitch & gain)
    startEngine() {
        this.ensureContext();
        if (!this.ctx || this.isEngineRunning) return;
        this.isEngineRunning = true;

        const t = this.ctx.currentTime;
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();

        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(45, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, t);

        this.engineGain.gain.setValueAtTime(0.01, t);
        this.engineGain.gain.linearRampToValueAtTime(0.2, t + 0.3);

        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);
        this.engineOsc.start(t);
    }

    updateEngine(speedRatio, isBoosting) {
        if (!this.ctx || !this.isEngineRunning || !this.engineOsc) return;
        const targetFreq = 40 + speedRatio * 85 + (isBoosting ? 40 : 0);
        this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
    }

    stopEngine() {
        if (!this.isEngineRunning || !this.engineGain) return;
        const t = this.ctx.currentTime;
        this.engineGain.gain.setTargetAtTime(0.001, t, 0.1);
        setTimeout(() => {
            if (this.engineOsc) {
                try { this.engineOsc.stop(); } catch (e) {}
                this.engineOsc.disconnect();
                this.engineOsc = null;
            }
            this.isEngineRunning = false;
        }, 150);
    }

    playNitro() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.4);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
        noise.stop(t + 0.41);
    }

    playHitMarker() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, t);
        osc.frequency.exponentialRampToValueAtTime(900, t + 0.05);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.06);
    }

    playHeadshot() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        // CS-style crisp helmet "dink" bell
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2600, t);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(3700, t);

        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.29);
        osc2.stop(t + 0.29);
    }

    playExplosion() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        // Sub blast
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(120, t);
        sub.frequency.exponentialRampToValueAtTime(20, t + 0.7);

        subGain.gain.setValueAtTime(1.0, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.71);

        // Low-pass noise blast
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.8);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.exponentialRampToValueAtTime(80, t + 0.8);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
        noise.stop(t + 0.81);
    }

    playReload() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;

        const makeClick = (delay, freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = t + delay;
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + 0.06);
        };

        makeClick(0.05, 400); // Mag release
        makeClick(0.35, 750); // Mag insert
        makeClick(0.70, 950); // Bolt rack
    }

    playRoundStart() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        [220, 277, 330, 440].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = t + idx * 0.12;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.35);
        });
    }

    playVictory() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const notes = [330, 392, 523, 659, 784];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = t + idx * 0.15;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.35, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.6);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.65);
        });
    }

    playDefeat() {
        this.ensureContext();
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime;
        const notes = [440, 415, 392, 330];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = t + idx * 0.25;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.3, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.5);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.55);
        });
    }
}

window.soundEngine = new SoundEngine();
