// Web Audio API Synthesizer & Natural AI Voice Narrator Engine
// Supports both synthesized upbeat background music and real AI voice narration

class PromoAudioEngine {
  private ctx: AudioContext | null = null;
  private isBgmPlaying = false;
  private bgmTimerId: number | null = null;
  private step = 0;

  // Narration player state
  private narrationAudio: HTMLAudioElement | null = null;
  private narrationBuffer: AudioBuffer | null = null;
  private narrationSource: AudioBufferSourceNode | null = null;
  private isNarrationPlaying = false;
  private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;
  private bgmGainNode: GainNode | null = null;

  public initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.mediaStreamDestination && this.ctx) {
      this.mediaStreamDestination = this.ctx.createMediaStreamDestination();
    }
  }

  // Play a quick kick drum sound
  private playKick(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

    // If narration is playing, duck the BGM volume slightly for voice clarity
    const baseGain = this.isNarrationPlaying ? 0.2 : 0.38;
    gain.gain.setValueAtTime(baseGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    if (this.mediaStreamDestination) {
      gain.connect(this.mediaStreamDestination);
    }

    osc.start(time);
    osc.stop(time + 0.14);
  }

  // Play snappy hi-hat
  private playHat(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(6000, time);
    osc.frequency.exponentialRampToValueAtTime(1000, time + 0.04);

    const baseGain = this.isNarrationPlaying ? 0.05 : 0.11;
    gain.gain.setValueAtTime(baseGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    if (this.mediaStreamDestination) {
      gain.connect(this.mediaStreamDestination);
    }

    osc.start(time);
    osc.stop(time + 0.04);
  }

  // Play cheerful melodic chord
  private playNote(freq: number, time: number, duration: number = 0.15) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    const baseGain = this.isNarrationPlaying ? 0.06 : 0.14;
    gain.gain.setValueAtTime(baseGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    if (this.mediaStreamDestination) {
      gain.connect(this.mediaStreamDestination);
    }

    osc.start(time);
    osc.stop(time + duration);
  }

  public startBgm() {
    this.initContext();
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    this.step = 0;

    // Upbeat 125 BPM groove
    const intervalMs = 125;
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 880.0, 1046.5];

    this.bgmTimerId = window.setInterval(() => {
      if (!this.ctx || !this.isBgmPlaying) return;
      const t = this.ctx.currentTime;
      const beat = this.step % 16;

      if (beat % 4 === 0) {
        this.playKick(t);
      }
      if (beat % 2 === 0) {
        this.playHat(t);
      }
      if (beat % 2 === 1) {
        const note = melody[(this.step / 2) % melody.length];
        this.playNote(note, t, 0.12);
      }

      this.step++;
    }, intervalMs);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimerId) {
      clearInterval(this.bgmTimerId);
      this.bgmTimerId = null;
    }
  }

  // Play AI Narration audio synchronized to current playback offset
  public async playNarration(audioBlobOrUrl: Blob | string, startOffsetSec: number = 0) {
    this.initContext();
    this.stopNarration();

    try {
      const audio = new Audio();
      if (typeof audioBlobOrUrl === 'string') {
        audio.src = audioBlobOrUrl;
      } else {
        audio.src = URL.createObjectURL(audioBlobOrUrl);
      }

      this.narrationAudio = audio;
      audio.currentTime = Math.max(0, startOffsetSec);

      audio.onended = () => {
        this.isNarrationPlaying = false;
      };

      await audio.play();
      this.isNarrationPlaying = true;
    } catch (err) {
      console.warn('Playback error for narration audio:', err);
      this.isNarrationPlaying = false;
    }
  }

  public stopNarration() {
    this.isNarrationPlaying = false;
    if (this.narrationAudio) {
      try {
        this.narrationAudio.pause();
        this.narrationAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.narrationAudio = null;
    }
    if (this.narrationSource) {
      try {
        this.narrationSource.stop();
      } catch (e) {
        // ignore
      }
      this.narrationSource = null;
    }
  }

  public seekNarration(timeSec: number) {
    if (this.narrationAudio) {
      this.narrationAudio.currentTime = Math.max(0, timeSec);
    }
  }

  public stopAll() {
    this.stopBgm();
    this.stopNarration();
  }

  // Backward compatibility alias
  public start() {
    this.startBgm();
  }

  public stop() {
    this.stopAll();
  }

  public isAudioPlaying() {
    return this.isBgmPlaying || this.isNarrationPlaying;
  }

  public isNarrationActive() {
    return this.isNarrationPlaying;
  }
}

export const promoAudio = new PromoAudioEngine();
