/**
 * Serviço de Áudio e Voz (Web Speech API e Web Audio Synthesizer)
 * Fornece alertas sonoros e instruções faladas em Português do Brasil.
 */

class AudioService {
  constructor() {
    this.isMuted = false;
    this.synth = window.speechSynthesis;
    this.audioCtx = null;
    this.lastSpokenText = '';
    this.lastSpokeTime = 0;
  }

  initAudioContext() {
    if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.synth) {
      this.synth.cancel();
    }
    return this.isMuted;
  }

  /**
   * Toca um tom de navegação sintético via Web Audio API
   */
  playTone(frequency = 440, duration = 0.15, type = 'sine') {
    if (this.isMuted) return;

    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.debug('Audio error:', e);
    }
  }

  /**
   * Alerta sonoro de recálculo de rota
   */
  playRerouteChime() {
    if (this.isMuted) return;
    this.playTone(523.25, 0.1, 'triangle'); // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'triangle'), 110); // E5
  }

  /**
   * Alerta sonoro de aproximação de manobra
   */
  playTurnChime() {
    if (this.isMuted) return;
    this.playTone(587.33, 0.1, 'sine'); // D5
  }

  /**
   * Alerta sonoro de chegada ao destino
   */
  playArrivalFanfare() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle'), idx * 120);
    });
  }

  /**
   * Fala a instrução usando a voz padrão em Português
   */
  speak(text, priority = false) {
    if (this.isMuted || !this.synth) return;

    const now = Date.now();
    // Evita repetição excessiva da mesma frase em menos de 8 segundos
    if (!priority && text === this.lastSpokenText && now - this.lastSpokeTime < 8000) {
      return;
    }

    this.lastSpokenText = text;
    this.lastSpokeTime = now;

    try {
      this.synth.cancel(); // Limpa fila anterior
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Tenta encontrar uma voz pt-BR natural se disponível
      const voices = this.synth.getVoices();
      const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      this.synth.speak(utterance);
    } catch (e) {
      console.debug('Speech error:', e);
    }
  }
}

export const audioService = new AudioService();
