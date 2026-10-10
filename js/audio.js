/**
 * AATAKSH - Audio Engine (Synthesized Procedural Web Audio API)
 * High-performance, zero-latency 3D spatialized sound synthesizer
 */

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.8;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;
        this.isMuted = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized && this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio API not supported or blocked", e);
        }
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx && !this.isMuted) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    // Helper to calculate distance attenuation for 3D sounds
    getDistanceGain(listenerPos, soundPos, maxDist = 80) {
        if (!listenerPos || !soundPos) return 1.0;
        const dx = listenerPos.x - soundPos.x;
        const dy = listenerPos.y - soundPos.y;
        const dz = listenerPos.z - soundPos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist >= maxDist) return 0;
        return Math.max(0, 1 - (dist / maxDist));
    }

    // Create colored white/pink noise buffer
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

    // Gunshot generator with weapon characteristics
    playGunshot(weaponType = 'rifle', position = null, listenerPos = null) {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const distGain = this.getDistanceGain(listenerPos, position, 120);
        if (distGain <= 0.01) return;

        const shotGain = this.ctx.createGain();
        shotGain.gain.setValueAtTime(this.sfxVolume * distGain, now);
        shotGain.connect(this.masterGain);

        switch (weaponType) {
            case 'sniper': {
                // AWM Heavy blast + sub bass + reverberant crack
                const osc = this.ctx.createOscillator();
                const oscGain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);
                oscGain.gain.setValueAtTime(1.2, now);
                oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                osc.connect(oscGain);
                oscGain.connect(shotGain);
                osc.start(now);
                osc.stop(now + 0.5);

                // Noise blast
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.createNoiseBuffer(0.6);
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1600, now);
                filter.frequency.exponentialRampToValueAtTime(200, now + 0.5);
                filter.Q.setValueAtTime(2.5, now);
                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(1.0, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(shotGain);
                noise.start(now);
                noise.stop(now + 0.6);
                break;
            }
            case 'shotgun': {
                // Spas-12 explosive wide burst
                const osc = this.ctx.createOscillator();
                const oscGain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);
                oscGain.gain.setValueAtTime(1.0, now);
                oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.connect(oscGain);
                oscGain.connect(shotGain);
                osc.start(now);
                osc.stop(now + 0.3);

                const noise = this.ctx.createBufferSource();
                noise.buffer = this.createNoiseBuffer(0.4);
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(2800, now);
                filter.frequency.exponentialRampToValueAtTime(400, now + 0.35);
                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(1.3, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(shotGain);
                noise.start(now);
                noise.stop(now + 0.4);
                break;
            }
            case 'pistol': {
                // Crisp pop
                const osc = this.ctx.createOscillator();
                const oscGain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
                oscGain.gain.setValueAtTime(0.8, now);
                oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                osc.connect(oscGain);
                oscGain.connect(shotGain);
                osc.start(now);
                osc.stop(now + 0.18);

                const noise = this.ctx.createBufferSource();
                noise.buffer = this.createNoiseBuffer(0.2);
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2200, now);
                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(0.7, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(shotGain);
                noise.start(now);
                noise.stop(now + 0.2);
                break;
            }
            case 'rifle':
            default: {
                // AK-47 punchy tactical crack
                const osc = this.ctx.createOscillator();
                const oscGain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
                oscGain.gain.setValueAtTime(0.9, now);
                oscGain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
                osc.connect(oscGain);
                oscGain.connect(shotGain);
                osc.start(now);
                osc.stop(now + 0.25);

                const noise = this.ctx.createBufferSource();
                noise.buffer = this.createNoiseBuffer(0.28);
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2600, now);
                filter.frequency.exponentialRampToValueAtTime(600, now + 0.25);
                const noiseGain = this.ctx.createGain();
                noiseGain.gain.setValueAtTime(0.85, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(shotGain);
                noise.start(now);
                noise.stop(now + 0.28);
                break;
            }
        }
    }

    // Reload sound stages
    playReload() {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        // Mag out
        this.playMechanicalClick(now, 600, 0.08);
        // Mag in
        this.playMechanicalClick(now + 0.45, 850, 0.1);
        // Bolt slide rack
        this.playMechanicalClick(now + 0.9, 1100, 0.12);
    }

    playMechanicalClick(time, freq, dur) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + dur);
        gain.gain.setValueAtTime(0.4 * this.sfxVolume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + dur);
    }

    // Hitmarker notification
    playHitmarker(isHeadshot = false) {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        if (isHeadshot) {
            // Bright satisfying headshot ding (double harmonic)
            [1760, 2640].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.04);
                gain.gain.setValueAtTime(0.5 * this.sfxVolume, now + idx * 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(now + idx * 0.04);
                osc.stop(now + idx * 0.04 + 0.25);
            });
        } else {
            // Sharp body hit tick
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1100, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);
            gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.06);
        }
    }

    // Massive Grenade Explosion
    playExplosion(position = null, listenerPos = null) {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const distGain = this.getDistanceGain(listenerPos, position, 200);
        if (distGain <= 0.01) return;

        // Sub bass thump
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.7);
        oscGain.gain.setValueAtTime(1.5 * this.sfxVolume * distGain, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.9);

        // Heavy explosive noise rumble
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(1.4);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + 1.2);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.6 * this.sfxVolume * distGain, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 1.4);
    }

    // Footsteps
    playFootstep(isSprint = false) {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.08);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(320, now);
        filter.Q.setValueAtTime(1.5, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime((isSprint ? 0.25 : 0.15) * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.08);
    }

    playJump() {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.15);
        gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    playLootPickup() {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            gain.gain.setValueAtTime(0.25 * this.sfxVolume, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.18);
        });
    }

    // Hero Abilities
    playAbility(type) {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        if (type === 'speed') {
            // High velocity cyber whoosh
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);
            gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'shield') {
            // Deep shield barrier activation
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.linearRampToValueAtTime(280, now + 0.25);
            osc.frequency.linearRampToValueAtTime(140, now + 0.6);
            gain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.7);
        }
    }

    // Safe zone warning alarm
    playStormAlert() {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.4);
        gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Victory BOOYAH! fanfare
    playVictory() {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const chord = [523.25, 659.25, 783.99, 1046.5]; // C major
        chord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            gain.gain.setValueAtTime(0.35 * this.sfxVolume, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 1.5);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 1.5);
        });
    }

    // Defeat sound
    playDefeat() {
        if (!this.initialized) this.init();
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const minorTones = [392.00, 311.13, 261.63, 196.00];
        minorTones.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.18);
            gain.gain.setValueAtTime(0.3 * this.sfxVolume, now + idx * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.8);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.18);
            osc.stop(now + idx * 0.18 + 0.8);
        });
    }
}

window.soundSystem = new SoundSystem();
