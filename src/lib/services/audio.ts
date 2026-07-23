// Web Audio API Synthesizer for SIVOJA Lottery Screen Sound Effects

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private drumInterval: number | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted() {
    return this.isMuted;
  }

  // Click / Tick Sound when numbers roll
  public playTick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 + Math.random() * 200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignore audio context errors
    }
  }

  // Start continuous Drumroll effect during shuffle
  public startDrumroll() {
    if (this.isMuted) return;
    this.stopDrumroll();
    this.initCtx();

    let speed = 70;
    const triggerSnare = () => {
      if (this.isMuted || !this.ctx) return;
      try {
        // Noise buffer for snare/drumroll
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12 + Math.random() * 0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
      } catch {
        // Ignore audio errors
      }
    };

    this.drumInterval = window.setInterval(triggerSnare, speed);
  }

  public stopDrumroll() {
    if (this.drumInterval !== null) {
      clearInterval(this.drumInterval);
      this.drumInterval = null;
    }
  }

  // Play triumphant Fanfare Chord when winner is picked!
  public playVictoryFanfare() {
    this.stopDrumroll();
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Arpeggio notes in C major / G major celebration
      const notes = [
        { freq: 523.25, time: 0, duration: 0.15 },    // C5
        { freq: 659.25, time: 0.12, duration: 0.15 }, // E5
        { freq: 783.99, time: 0.24, duration: 0.15 }, // G5
        { freq: 1046.50, time: 0.38, duration: 0.8 }, // C6 (long chord)
        { freq: 783.99, time: 0.38, duration: 0.8 },  // G5 (harmony)
        { freq: 659.25, time: 0.38, duration: 0.8 },  // E5 (harmony)
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0, now + n.time);
        gain.gain.linearRampToValueAtTime(0.2, now + n.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.duration);
      });
    } catch {
      // Ignore audio errors
    }
  }
}

export const soundManager = new SoundManager();
