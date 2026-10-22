// ========================================================
// COSMO VELOCITY 3D - DYNAMIC SYNTHWAVE AUDIO ENGINE
// Full Procedural Sound Synthesizer: Multi-Track BGM + Engine Hum + SFX
// 100% Native Web Audio API - Zero External Dependencies
// ========================================================

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmInterval = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;

    // Engine Hum Nodes
    this.engineOsc = null;
    this.engineGain = null;

    this.initContext();
  }

  initContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }
  }

  unlock() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // 1. Dynamic Engine Hum (Changes pitch as speed increases)
  startEngineHum() {
    if (!this.ctx || this.engineOsc) return;
    this.unlock();

    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc.start();
  }

  updateEngineHum(speedRatio) {
    if (!this.ctx || !this.engineOsc) return;
    const baseFreq = 50;
    const targetFreq = baseFreq + speedRatio * 85;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  stopEngineHum() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch (e) {}
      this.engineOsc = null;
    }
  }

  // 2. High-Octane Procedural Cyberpunk Synthwave Soundtrack
  // Bassline + Arpeggio + Synthesized Kick/HiHat
  startBGM() {
    if (!this.ctx || this.bgmPlaying) return;
    this.unlock();
    this.bgmPlaying = true;
    this.startEngineHum();

    // 135 BPM -> ~111ms per 16th note
    const stepDuration = 111;
    let step = 0;

    // Chord Progression: A minor -> F major -> G major -> E minor
    const bassRootNotes = [110, 110, 87.31, 87.31, 98.0, 98.0, 82.41, 82.41];
    const arpNotes = [
      440, 523.25, 659.25, 880, 659.25, 523.25, 783.99, 659.25,
      349.23, 440, 523.25, 698.46, 523.25, 440, 659.25, 523.25
    ];

    this.bgmInterval = setInterval(() => {
      if (this.isMuted || !this.bgmPlaying || !this.ctx) return;
      const t = this.ctx.currentTime;
      const step16 = step % 16;

      // A. Bass Note (Every 2 steps = 8th note driving groove)
      if (step16 % 2 === 0) {
        const rootIdx = Math.floor(step16 / 2) % bassRootNotes.length;
        const freq = bassRootNotes[rootIdx];

        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        const bassFilter = this.ctx.createBiquadFilter();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(freq, t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(320, t);
        bassFilter.frequency.exponentialRampToValueAtTime(100, t + 0.18);

        bassGain.gain.setValueAtTime(0.2, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.bgmGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.2);
      }

      // B. Synth Lead Arpeggio
      const arpFreq = arpNotes[step % arpNotes.length];
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      const leadFilter = this.ctx.createBiquadFilter();

      leadOsc.type = 'square';
      leadOsc.frequency.setValueAtTime(arpFreq, t);

      leadFilter.type = 'bandpass';
      leadFilter.frequency.setValueAtTime(arpFreq * 1.5, t);
      leadFilter.Q.setValueAtTime(3.0, t);

      leadGain.gain.setValueAtTime(0.08, t);
      leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(this.bgmGain);

      leadOsc.start(t);
      leadOsc.stop(t + 0.11);

      // C. Synthesized Kick Drum on beats 0, 4, 8, 12
      if (step16 % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();

        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.08);

        kickGain.gain.setValueAtTime(0.35, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGain);

        kickOsc.start(t);
        kickOsc.stop(t + 0.11);
      }

      // D. Synthesized Hi-Hat (White noise on off-beats)
      if (step16 % 2 === 1) {
        this.playHiHat(t);
      }

      step++;
    }, stepDuration);
  }

  playHiHat(t) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    noise.start(t);
    noise.stop(t + 0.035);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.stopEngineHum();
  }

  // 3. Sound Effects (SFX)

  // Crystal Collect Chime (Sparkly double tone)
  playCoin() {
    if (!this.ctx || this.isMuted) return;
    this.unlock();

    const t = this.ctx.currentTime;
    [1318.51, 1661.22, 1975.53].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.04);
      gain.gain.setValueAtTime(0.22, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.25);
    });
  }

  // Jump Booster
  playJump() {
    if (!this.ctx || this.isMuted) return;
    this.unlock();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(540, t + 0.18);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.24);
  }

  // Speed Boost Ramp Jump (Hyper thrust roar)
  playBoostRamp() {
    if (!this.ctx || this.isMuted) return;
    this.unlock();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(980, t + 0.45);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.52);
  }

  // Nitro Boost (Shift key or button)
  playNitro() {
    if (!this.ctx || this.isMuted) return;
    this.unlock();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.3);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.38);
  }

  // Powerup Pickup
  playPowerup() {
    if (!this.ctx || this.isMuted) return;
    this.unlock();

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);
      gain.gain.setValueAtTime(0.2, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.28);
    });
  }

  // Level Clear Fanfare Jingle!
  playLevelClear() {
    if (!this.ctx || this.isMuted) return;
    this.unlock();

    const t = this.ctx.currentTime;
    const victoryNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    victoryNotes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.12);
      gain.gain.setValueAtTime(0.3, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.45);
    });
  }

  // Crash Explosion
  playCrash() {
    if (!this.ctx || this.isMuted) return;
    this.unlock();

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(30, t + 0.55);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.6);
  }
}

window.soundSystem = new SoundSystem();
