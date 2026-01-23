// ========================================
// Audio System - Web Audio API
// Enhanced Sound Effects Variety
// ========================================

let audioContext = null;
const engineNodes = {
  noiseSource: null,
  rumbleOscillator: null,
  pulseOscillator: null,
  lowPassFilter: null,
  highPassFilter: null,
  masterGain: null,
  noiseGain: null,
  rumbleGain: null,
  noisePulseGain: null,
  rumbleFreqMod: null,
  filterMod: null,
  noisePulseOffset: null,
  rumbleFreqOffset: null,
  filterOffset: null
};
export let isEngineRunning = false;

// Sound volume controls
const volumes = {
  master: 0.25,
  fire: 0.3,
  explosion: 0.4,
  special: 0.35,
  feedback: 0.25,
  warning: 0.3
};

// Initialize audio context (must be triggered by user interaction)
export function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain node for volume control
      engineNodes.masterGain = audioContext.createGain();
      engineNodes.masterGain.gain.value = volumes.master;
      engineNodes.masterGain.connect(audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }
  
  // Resume audio context if suspended
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(e => {
      console.warn('Could not resume audio context:', e);
    });
  }
}

// Helper: Create noise buffer
function createNoiseBuffer(duration, amplitude = 1.0) {
  const bufferSize = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * amplitude;
  }
  return buffer;
}

// Helper: Safe sound play with error handling
function safePlay(fn) {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return;
  }
  try {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    fn();
  } catch (e) {
    console.warn('Error playing sound:', e);
  }
}

// Start rocket engine sound
export function startEngineSound() {
  if (!audioContext || isEngineRunning) return;
  
  try {
    // Create filters for rocket engine sound
    engineNodes.lowPassFilter = audioContext.createBiquadFilter();
    engineNodes.lowPassFilter.type = 'lowpass';
    engineNodes.lowPassFilter.frequency.value = 800;
    engineNodes.lowPassFilter.Q.value = 1;
    
    engineNodes.highPassFilter = audioContext.createBiquadFilter();
    engineNodes.highPassFilter.type = 'highpass';
    engineNodes.highPassFilter.frequency.value = 40;
    engineNodes.highPassFilter.Q.value = 1;
    
    // Connect filters
    engineNodes.highPassFilter.connect(engineNodes.lowPassFilter);
    engineNodes.lowPassFilter.connect(engineNodes.masterGain);
    
    // WHITE NOISE - Turbulent exhaust sound
    engineNodes.noiseSource = audioContext.createBufferSource();
    const bufferSize = audioContext.sampleRate * 2;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    engineNodes.noiseSource.buffer = noiseBuffer;
    engineNodes.noiseSource.loop = true;
    
    engineNodes.noiseGain = audioContext.createGain();
    engineNodes.noiseGain.gain.value = 0.4;
    
    engineNodes.noiseSource.connect(engineNodes.noiseGain);
    engineNodes.noiseGain.connect(engineNodes.highPassFilter);
    
    // LOW FREQUENCY RUMBLE
    engineNodes.rumbleOscillator = audioContext.createOscillator();
    engineNodes.rumbleOscillator.type = 'sawtooth';
    engineNodes.rumbleOscillator.frequency.value = 45;
    
    engineNodes.rumbleGain = audioContext.createGain();
    engineNodes.rumbleGain.gain.value = 0.25;
    
    engineNodes.rumbleOscillator.connect(engineNodes.rumbleGain);
    engineNodes.rumbleGain.connect(engineNodes.highPassFilter);
    
    // PULSE MODULATION
    engineNodes.pulseOscillator = audioContext.createOscillator();
    engineNodes.pulseOscillator.type = 'sine';
    engineNodes.pulseOscillator.frequency.value = 3.2;
    
    // Modulate noise gain
    if (typeof audioContext.createConstantSource === 'function') {
      const noiseBase = audioContext.createConstantSource();
      noiseBase.offset.value = 0.4;
      noiseBase.connect(engineNodes.noiseGain.gain);
      noiseBase.start();
      engineNodes.noisePulseOffset = noiseBase;
    } else {
      engineNodes.noiseGain.gain.value = 0.4;
    }
    
    const noisePulseGain = audioContext.createGain();
    noisePulseGain.gain.value = 0.15;
    engineNodes.pulseOscillator.connect(noisePulseGain);
    noisePulseGain.connect(engineNodes.noiseGain.gain);
    
    // Modulate rumble frequency
    if (typeof audioContext.createConstantSource === 'function') {
      const rumbleBase = audioContext.createConstantSource();
      rumbleBase.offset.value = 45;
      rumbleBase.connect(engineNodes.rumbleOscillator.frequency);
      rumbleBase.start();
      engineNodes.rumbleFreqOffset = rumbleBase;
    } else {
      engineNodes.rumbleOscillator.frequency.value = 45;
    }
    
    const rumbleFreqMod = audioContext.createGain();
    rumbleFreqMod.gain.value = 8;
    engineNodes.pulseOscillator.connect(rumbleFreqMod);
    rumbleFreqMod.connect(engineNodes.rumbleOscillator.frequency);
    
    // Modulate low-pass filter frequency
    if (typeof audioContext.createConstantSource === 'function') {
      const filterBase = audioContext.createConstantSource();
      filterBase.offset.value = 800;
      filterBase.connect(engineNodes.lowPassFilter.frequency);
      filterBase.start();
      engineNodes.filterOffset = filterBase;
    } else {
      engineNodes.lowPassFilter.frequency.value = 800;
    }
    
    const filterMod = audioContext.createGain();
    filterMod.gain.value = 120;
    engineNodes.pulseOscillator.connect(filterMod);
    filterMod.connect(engineNodes.lowPassFilter.frequency);
    
    // Start all sources
    engineNodes.noiseSource.start();
    engineNodes.rumbleOscillator.start();
    engineNodes.pulseOscillator.start();
    
    // Store modulation nodes for cleanup
    engineNodes.noisePulseGain = noisePulseGain;
    engineNodes.rumbleFreqMod = rumbleFreqMod;
    engineNodes.filterMod = filterMod;
    
    isEngineRunning = true;
  } catch (e) {
    console.warn('Error starting engine sound:', e);
  }
}

// Stop rocket engine sound
export function stopEngineSound() {
  if (!isEngineRunning) return;
  
  try {
    if (engineNodes.noiseSource) {
      engineNodes.noiseSource.stop();
      engineNodes.noiseSource = null;
    }
    if (engineNodes.rumbleOscillator) {
      engineNodes.rumbleOscillator.stop();
      engineNodes.rumbleOscillator = null;
    }
    if (engineNodes.pulseOscillator) {
      engineNodes.pulseOscillator.stop();
      engineNodes.pulseOscillator = null;
    }
    if (engineNodes.noisePulseOffset) {
      engineNodes.noisePulseOffset.stop();
      engineNodes.noisePulseOffset.disconnect();
      engineNodes.noisePulseOffset = null;
    }
    if (engineNodes.rumbleFreqOffset) {
      engineNodes.rumbleFreqOffset.stop();
      engineNodes.rumbleFreqOffset.disconnect();
      engineNodes.rumbleFreqOffset = null;
    }
    if (engineNodes.filterOffset) {
      engineNodes.filterOffset.stop();
      engineNodes.filterOffset.disconnect();
      engineNodes.filterOffset = null;
    }
    if (engineNodes.noisePulseGain) {
      engineNodes.noisePulseGain.disconnect();
      engineNodes.noisePulseGain = null;
    }
    if (engineNodes.rumbleFreqMod) {
      engineNodes.rumbleFreqMod.disconnect();
      engineNodes.rumbleFreqMod = null;
    }
    if (engineNodes.filterMod) {
      engineNodes.filterMod.disconnect();
      engineNodes.filterMod = null;
    }
    if (engineNodes.lowPassFilter) {
      engineNodes.lowPassFilter.disconnect();
      engineNodes.lowPassFilter = null;
    }
    if (engineNodes.highPassFilter) {
      engineNodes.highPassFilter.disconnect();
      engineNodes.highPassFilter = null;
    }
    if (engineNodes.noiseGain) {
      engineNodes.noiseGain.disconnect();
      engineNodes.noiseGain = null;
    }
    if (engineNodes.rumbleGain) {
      engineNodes.rumbleGain.disconnect();
      engineNodes.rumbleGain = null;
    }
    
    isEngineRunning = false;
  } catch (e) {
    console.warn('Error stopping engine sound:', e);
  }
}

// ========================================
// PLAYER SOUNDS
// ========================================

// Play firing sound effect (player bullet)
export function playFireSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 0.15;
    
    // Main tone: high frequency sweep down
    const mainOsc = audioContext.createOscillator();
    mainOsc.type = 'sawtooth';
    mainOsc.frequency.setValueAtTime(800, now);
    mainOsc.frequency.exponentialRampToValueAtTime(400, now + duration);
    
    // Secondary tone
    const subOsc = audioContext.createOscillator();
    subOsc.type = 'square';
    subOsc.frequency.setValueAtTime(600, now);
    subOsc.frequency.exponentialRampToValueAtTime(300, now + duration);
    
    // Gain envelopes
    const mainGain = audioContext.createGain();
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(volumes.fire, now + 0.01);
    mainGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const subGain = audioContext.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(volumes.fire * 0.5, now + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Noise for crack effect
    const noiseBuffer = createNoiseBuffer(duration, 0.3);
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.1, now + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 2000;
    
    // Connect
    mainOsc.connect(mainGain);
    subOsc.connect(subGain);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    
    mainGain.connect(audioContext.destination);
    subGain.connect(audioContext.destination);
    noiseGain.connect(audioContext.destination);
    
    // Start and stop
    mainOsc.start(now);
    mainOsc.stop(now + duration);
    subOsc.start(now);
    subOsc.stop(now + duration);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
  });
}

// ========================================
// EXPLOSION SOUNDS
// ========================================

// Generic explosion (legacy support)
export function playExplosionSound() {
  playHunterExplosionSound();
}

// Bee explosion - small pop with buzz cutoff
export function playBeeExplosionSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 0.25;
    
    // Quick pop tone
    const popOsc = audioContext.createOscillator();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(400, now);
    popOsc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    
    const popGain = audioContext.createGain();
    popGain.gain.setValueAtTime(0, now);
    popGain.gain.linearRampToValueAtTime(volumes.explosion * 0.6, now + 0.008);
    popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    
    // Buzz cutoff sound
    const buzzOsc = audioContext.createOscillator();
    buzzOsc.type = 'sawtooth';
    buzzOsc.frequency.setValueAtTime(180, now);
    buzzOsc.frequency.exponentialRampToValueAtTime(40, now + duration);
    
    const buzzGain = audioContext.createGain();
    buzzGain.gain.setValueAtTime(0, now);
    buzzGain.gain.linearRampToValueAtTime(volumes.explosion * 0.3, now + 0.01);
    buzzGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Small splat noise
    const noiseBuffer = createNoiseBuffer(duration, 0.4);
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(volumes.explosion * 0.25, now + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 600;
    noiseFilter.Q.value = 2;
    
    // Connect
    popOsc.connect(popGain);
    buzzOsc.connect(buzzGain);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    
    popGain.connect(audioContext.destination);
    buzzGain.connect(audioContext.destination);
    noiseGain.connect(audioContext.destination);
    
    // Start
    popOsc.start(now);
    popOsc.stop(now + 0.12);
    buzzOsc.start(now);
    buzzOsc.stop(now + duration);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
  });
}

// Hunter explosion - big dramatic explosion with reverb feel
export function playHunterExplosionSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 1.2;
    
    // LOW RUMBLE
    const rumbleOsc = audioContext.createOscillator();
    rumbleOsc.type = 'sawtooth';
    rumbleOsc.frequency.setValueAtTime(40, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(20, now + duration);
    
    const rumbleGain = audioContext.createGain();
    rumbleGain.gain.setValueAtTime(0, now);
    rumbleGain.gain.linearRampToValueAtTime(volumes.explosion, now + 0.05);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const rumbleFilter = audioContext.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 200;
    rumbleFilter.Q.value = 1;
    
    // EXPLOSION NOISE
    const noiseBuffer = createNoiseBuffer(duration, 0.8);
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(volumes.explosion * 1.25, now + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.6);
    
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 2;
    
    // HIGH FREQUENCY CRACK
    const crackOsc = audioContext.createOscillator();
    crackOsc.type = 'square';
    crackOsc.frequency.setValueAtTime(2000, now);
    crackOsc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    
    const crackGain = audioContext.createGain();
    crackGain.gain.setValueAtTime(0, now);
    crackGain.gain.linearRampToValueAtTime(volumes.explosion * 0.75, now + 0.005);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    // METALLIC RING
    const ringOsc = audioContext.createOscillator();
    ringOsc.type = 'triangle';
    ringOsc.frequency.setValueAtTime(1200, now);
    ringOsc.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    
    const ringGain = audioContext.createGain();
    ringGain.gain.setValueAtTime(0, now);
    ringGain.gain.linearRampToValueAtTime(volumes.explosion * 0.2, now + 0.01);
    ringGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    // DELAY EFFECTS (reverb simulation)
    const delay1 = audioContext.createDelay(0.5);
    delay1.delayTime.value = 0.1;
    const delayGain1 = audioContext.createGain();
    delayGain1.gain.value = 0.3;
    
    const delay2 = audioContext.createDelay(0.5);
    delay2.delayTime.value = 0.2;
    const delayGain2 = audioContext.createGain();
    delayGain2.gain.value = 0.15;
    
    // Connect
    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(audioContext.destination);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    
    crackOsc.connect(crackGain);
    crackGain.connect(audioContext.destination);
    
    ringOsc.connect(ringGain);
    ringGain.connect(audioContext.destination);
    
    noiseGain.connect(delay1);
    delay1.connect(delayGain1);
    delayGain1.connect(audioContext.destination);
    
    noiseGain.connect(delay2);
    delay2.connect(delayGain2);
    delayGain2.connect(audioContext.destination);
    
    // Start all sources
    rumbleOsc.start(now);
    rumbleOsc.stop(now + duration);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
    crackOsc.start(now);
    crackOsc.stop(now + 0.15);
    ringOsc.start(now);
    ringOsc.stop(now + 0.5);
  });
}

// Cell explosion - structural crumble with cracking
export function playCellExplosionSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 0.6;
    
    // Crumbling rumble
    const rumbleOsc = audioContext.createOscillator();
    rumbleOsc.type = 'triangle';
    rumbleOsc.frequency.setValueAtTime(100, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(30, now + duration);
    
    const rumbleGain = audioContext.createGain();
    rumbleGain.gain.setValueAtTime(0, now);
    rumbleGain.gain.linearRampToValueAtTime(volumes.explosion * 0.5, now + 0.03);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Cracking noise with multiple bands
    const crackBuffer = createNoiseBuffer(duration, 0.6);
    const crackSource = audioContext.createBufferSource();
    crackSource.buffer = crackBuffer;
    
    const crackGain = audioContext.createGain();
    crackGain.gain.setValueAtTime(0, now);
    crackGain.gain.linearRampToValueAtTime(volumes.explosion * 0.4, now + 0.01);
    crackGain.gain.setValueAtTime(volumes.explosion * 0.3, now + 0.1);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const crackFilter = audioContext.createBiquadFilter();
    crackFilter.type = 'highpass';
    crackFilter.frequency.value = 1000;
    crackFilter.Q.value = 1;
    
    // Chunky low end
    const chunkOsc = audioContext.createOscillator();
    chunkOsc.type = 'sawtooth';
    chunkOsc.frequency.setValueAtTime(60, now);
    chunkOsc.frequency.exponentialRampToValueAtTime(25, now + duration * 0.7);
    
    const chunkGain = audioContext.createGain();
    chunkGain.gain.setValueAtTime(0, now);
    chunkGain.gain.linearRampToValueAtTime(volumes.explosion * 0.35, now + 0.02);
    chunkGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.7);
    
    // Connect
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(audioContext.destination);
    
    crackSource.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(audioContext.destination);
    
    chunkOsc.connect(chunkGain);
    chunkGain.connect(audioContext.destination);
    
    // Start
    rumbleOsc.start(now);
    rumbleOsc.stop(now + duration);
    crackSource.start(now);
    crackSource.stop(now + duration);
    chunkOsc.start(now);
    chunkOsc.stop(now + duration * 0.7);
  });
}

// ========================================
// SPECIAL WEAPON SOUNDS
// ========================================

// Freeze bomb - icy crystalline burst
export function playFreezeSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 0.5;
    
    // Crystalline shimmer (multiple detuned oscillators)
    const freqs = [2400, 3200, 4000, 4800];
    freqs.forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + duration);
      
      const gain = audioContext.createGain();
      const delay = i * 0.02;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volumes.special * 0.2, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.start(now + delay);
      osc.stop(now + duration);
    });
    
    // Whoosh down
    const whooshOsc = audioContext.createOscillator();
    whooshOsc.type = 'sawtooth';
    whooshOsc.frequency.setValueAtTime(800, now);
    whooshOsc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    
    const whooshGain = audioContext.createGain();
    whooshGain.gain.setValueAtTime(0, now);
    whooshGain.gain.linearRampToValueAtTime(volumes.special * 0.4, now + 0.02);
    whooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    const whooshFilter = audioContext.createBiquadFilter();
    whooshFilter.type = 'bandpass';
    whooshFilter.frequency.value = 600;
    whooshFilter.Q.value = 2;
    
    whooshOsc.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(audioContext.destination);
    
    whooshOsc.start(now);
    whooshOsc.stop(now + 0.25);
    
    // Crackle noise (ice forming)
    const crackleBuffer = createNoiseBuffer(duration, 0.3);
    const crackleSource = audioContext.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    
    const crackleGain = audioContext.createGain();
    crackleGain.gain.setValueAtTime(0, now);
    crackleGain.gain.linearRampToValueAtTime(volumes.special * 0.15, now + 0.05);
    crackleGain.gain.setValueAtTime(volumes.special * 0.1, now + 0.2);
    crackleGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const crackleFilter = audioContext.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 3000;
    
    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(audioContext.destination);
    
    crackleSource.start(now);
    crackleSource.stop(now + duration);
  });
}

// Electric blast - zappy electricity
export function playElectricSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 0.4;
    
    // Main zap (rapid frequency modulation)
    const zapOsc = audioContext.createOscillator();
    zapOsc.type = 'sawtooth';
    zapOsc.frequency.setValueAtTime(150, now);
    
    // Modulate frequency rapidly for electric crackle
    const modOsc = audioContext.createOscillator();
    modOsc.type = 'square';
    modOsc.frequency.value = 60;
    
    const modGain = audioContext.createGain();
    modGain.gain.value = 100;
    
    modOsc.connect(modGain);
    modGain.connect(zapOsc.frequency);
    
    const zapGain = audioContext.createGain();
    zapGain.gain.setValueAtTime(0, now);
    zapGain.gain.linearRampToValueAtTime(volumes.special * 0.5, now + 0.01);
    zapGain.gain.setValueAtTime(volumes.special * 0.4, now + 0.1);
    zapGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // High frequency crackle
    const crackleOsc = audioContext.createOscillator();
    crackleOsc.type = 'square';
    crackleOsc.frequency.setValueAtTime(4000, now);
    crackleOsc.frequency.setValueAtTime(2000, now + 0.05);
    crackleOsc.frequency.setValueAtTime(5000, now + 0.1);
    crackleOsc.frequency.setValueAtTime(1500, now + 0.15);
    crackleOsc.frequency.setValueAtTime(3500, now + 0.2);
    
    const crackleGain = audioContext.createGain();
    crackleGain.gain.setValueAtTime(0, now);
    crackleGain.gain.linearRampToValueAtTime(volumes.special * 0.15, now + 0.005);
    crackleGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.8);
    
    // Arc sound (rising then falling)
    const arcOsc = audioContext.createOscillator();
    arcOsc.type = 'triangle';
    arcOsc.frequency.setValueAtTime(200, now);
    arcOsc.frequency.linearRampToValueAtTime(1200, now + 0.1);
    arcOsc.frequency.exponentialRampToValueAtTime(80, now + duration);
    
    const arcGain = audioContext.createGain();
    arcGain.gain.setValueAtTime(0, now);
    arcGain.gain.linearRampToValueAtTime(volumes.special * 0.3, now + 0.05);
    arcGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Connect
    zapOsc.connect(zapGain);
    zapGain.connect(audioContext.destination);
    
    crackleOsc.connect(crackleGain);
    crackleGain.connect(audioContext.destination);
    
    arcOsc.connect(arcGain);
    arcGain.connect(audioContext.destination);
    
    // Start
    modOsc.start(now);
    modOsc.stop(now + duration);
    zapOsc.start(now);
    zapOsc.stop(now + duration);
    crackleOsc.start(now);
    crackleOsc.stop(now + duration * 0.8);
    arcOsc.start(now);
    arcOsc.stop(now + duration);
  });
}

// Warp teleport - whoosh with phase shift
export function playWarpSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 0.35;
    
    // Departure whoosh (down)
    const departOsc = audioContext.createOscillator();
    departOsc.type = 'sine';
    departOsc.frequency.setValueAtTime(600, now);
    departOsc.frequency.exponentialRampToValueAtTime(50, now + 0.12);
    
    const departGain = audioContext.createGain();
    departGain.gain.setValueAtTime(0, now);
    departGain.gain.linearRampToValueAtTime(volumes.special * 0.5, now + 0.01);
    departGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    // Arrival whoosh (up)
    const arriveOsc = audioContext.createOscillator();
    arriveOsc.type = 'sine';
    arriveOsc.frequency.setValueAtTime(50, now + 0.12);
    arriveOsc.frequency.exponentialRampToValueAtTime(500, now + 0.25);
    arriveOsc.frequency.exponentialRampToValueAtTime(200, now + duration);
    
    const arriveGain = audioContext.createGain();
    arriveGain.gain.setValueAtTime(0, now + 0.1);
    arriveGain.gain.linearRampToValueAtTime(volumes.special * 0.45, now + 0.2);
    arriveGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Phase shift noise
    const phaseBuffer = createNoiseBuffer(duration, 0.5);
    const phaseSource = audioContext.createBufferSource();
    phaseSource.buffer = phaseBuffer;
    
    const phaseGain = audioContext.createGain();
    phaseGain.gain.setValueAtTime(0, now);
    phaseGain.gain.linearRampToValueAtTime(volumes.special * 0.2, now + 0.05);
    phaseGain.gain.setValueAtTime(volumes.special * 0.05, now + 0.15);
    phaseGain.gain.linearRampToValueAtTime(volumes.special * 0.15, now + 0.2);
    phaseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const phaseFilter = audioContext.createBiquadFilter();
    phaseFilter.type = 'bandpass';
    phaseFilter.frequency.setValueAtTime(1000, now);
    phaseFilter.frequency.linearRampToValueAtTime(200, now + 0.15);
    phaseFilter.frequency.linearRampToValueAtTime(800, now + duration);
    phaseFilter.Q.value = 5;
    
    // Harmonic shimmer
    const shimmerOsc = audioContext.createOscillator();
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.setValueAtTime(1200, now);
    shimmerOsc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    shimmerOsc.frequency.setValueAtTime(800, now + 0.18);
    shimmerOsc.frequency.exponentialRampToValueAtTime(1500, now + 0.28);
    
    const shimmerGain = audioContext.createGain();
    shimmerGain.gain.setValueAtTime(0, now);
    shimmerGain.gain.linearRampToValueAtTime(volumes.special * 0.1, now + 0.02);
    shimmerGain.gain.setValueAtTime(0.01, now + 0.12);
    shimmerGain.gain.linearRampToValueAtTime(volumes.special * 0.12, now + 0.2);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Connect
    departOsc.connect(departGain);
    departGain.connect(audioContext.destination);
    
    arriveOsc.connect(arriveGain);
    arriveGain.connect(audioContext.destination);
    
    phaseSource.connect(phaseFilter);
    phaseFilter.connect(phaseGain);
    phaseGain.connect(audioContext.destination);
    
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(audioContext.destination);
    
    // Start
    departOsc.start(now);
    departOsc.stop(now + 0.15);
    arriveOsc.start(now + 0.1);
    arriveOsc.stop(now + duration);
    phaseSource.start(now);
    phaseSource.stop(now + duration);
    shimmerOsc.start(now);
    shimmerOsc.stop(now + duration);
  });
}

// ========================================
// FEEDBACK SOUNDS
// ========================================

// Shield hit - energy absorption
export function playShieldHitSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 0.2;
    
    // Energy absorption ping
    const pingOsc = audioContext.createOscillator();
    pingOsc.type = 'sine';
    pingOsc.frequency.setValueAtTime(1500, now);
    pingOsc.frequency.exponentialRampToValueAtTime(400, now + duration);
    
    const pingGain = audioContext.createGain();
    pingGain.gain.setValueAtTime(0, now);
    pingGain.gain.linearRampToValueAtTime(volumes.feedback * 0.6, now + 0.005);
    pingGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Electric crackle
    const crackleBuffer = createNoiseBuffer(0.1, 0.3);
    const crackleSource = audioContext.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    
    const crackleGain = audioContext.createGain();
    crackleGain.gain.setValueAtTime(0, now);
    crackleGain.gain.linearRampToValueAtTime(volumes.feedback * 0.3, now + 0.003);
    crackleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    const crackleFilter = audioContext.createBiquadFilter();
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.value = 2000;
    
    // Connect
    pingOsc.connect(pingGain);
    pingGain.connect(audioContext.destination);
    
    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(audioContext.destination);
    
    // Start
    pingOsc.start(now);
    pingOsc.stop(now + duration);
    crackleSource.start(now);
    crackleSource.stop(now + 0.1);
  });
}

// Health hit - painful impact
export function playHealthHitSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 0.3;
    
    // Impact thud
    const thudOsc = audioContext.createOscillator();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(150, now);
    thudOsc.frequency.exponentialRampToValueAtTime(40, now + duration);
    
    const thudGain = audioContext.createGain();
    thudGain.gain.setValueAtTime(0, now);
    thudGain.gain.linearRampToValueAtTime(volumes.feedback * 0.7, now + 0.01);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Distorted crunch
    const crunchOsc = audioContext.createOscillator();
    crunchOsc.type = 'square';
    crunchOsc.frequency.setValueAtTime(80, now);
    crunchOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    
    const crunchGain = audioContext.createGain();
    crunchGain.gain.setValueAtTime(0, now);
    crunchGain.gain.linearRampToValueAtTime(volumes.feedback * 0.4, now + 0.005);
    crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    // Alarm tone (danger indicator)
    const alarmOsc = audioContext.createOscillator();
    alarmOsc.type = 'triangle';
    alarmOsc.frequency.setValueAtTime(800, now);
    alarmOsc.frequency.setValueAtTime(600, now + 0.05);
    alarmOsc.frequency.setValueAtTime(800, now + 0.1);
    
    const alarmGain = audioContext.createGain();
    alarmGain.gain.setValueAtTime(0, now);
    alarmGain.gain.linearRampToValueAtTime(volumes.feedback * 0.2, now + 0.01);
    alarmGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    // Connect
    thudOsc.connect(thudGain);
    thudGain.connect(audioContext.destination);
    
    crunchOsc.connect(crunchGain);
    crunchGain.connect(audioContext.destination);
    
    alarmOsc.connect(alarmGain);
    alarmGain.connect(audioContext.destination);
    
    // Start
    thudOsc.start(now);
    thudOsc.stop(now + duration);
    crunchOsc.start(now);
    crunchOsc.stop(now + 0.15);
    alarmOsc.start(now);
    alarmOsc.stop(now + 0.15);
  });
}

// Hunter laser fire
export function playHunterLaserSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 0.18;
    
    // Pew pew laser
    const laserOsc = audioContext.createOscillator();
    laserOsc.type = 'sawtooth';
    laserOsc.frequency.setValueAtTime(1200, now);
    laserOsc.frequency.exponentialRampToValueAtTime(300, now + duration);
    
    const laserGain = audioContext.createGain();
    laserGain.gain.setValueAtTime(0, now);
    laserGain.gain.linearRampToValueAtTime(volumes.feedback * 0.35, now + 0.005);
    laserGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const laserFilter = audioContext.createBiquadFilter();
    laserFilter.type = 'bandpass';
    laserFilter.frequency.value = 800;
    laserFilter.Q.value = 3;
    
    // Harmonic for "energy" feel
    const harmOsc = audioContext.createOscillator();
    harmOsc.type = 'sine';
    harmOsc.frequency.setValueAtTime(2400, now);
    harmOsc.frequency.exponentialRampToValueAtTime(600, now + duration);
    
    const harmGain = audioContext.createGain();
    harmGain.gain.setValueAtTime(0, now);
    harmGain.gain.linearRampToValueAtTime(volumes.feedback * 0.15, now + 0.003);
    harmGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.7);
    
    // Connect
    laserOsc.connect(laserFilter);
    laserFilter.connect(laserGain);
    laserGain.connect(audioContext.destination);
    
    harmOsc.connect(harmGain);
    harmGain.connect(audioContext.destination);
    
    // Start
    laserOsc.start(now);
    laserOsc.stop(now + duration);
    harmOsc.start(now);
    harmOsc.stop(now + duration * 0.7);
  });
}

// ========================================
// WARNING SOUNDS
// ========================================

// Dropship warning alarm
export function playDropshipWarningSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 1.0;
    
    // Warning siren (two-tone)
    const sirenOsc = audioContext.createOscillator();
    sirenOsc.type = 'square';
    
    // Alternate between two frequencies
    for (let i = 0; i < 4; i++) {
      sirenOsc.frequency.setValueAtTime(600, now + i * 0.25);
      sirenOsc.frequency.setValueAtTime(400, now + i * 0.25 + 0.125);
    }
    
    const sirenGain = audioContext.createGain();
    sirenGain.gain.setValueAtTime(0, now);
    sirenGain.gain.linearRampToValueAtTime(volumes.warning * 0.3, now + 0.02);
    sirenGain.gain.setValueAtTime(volumes.warning * 0.3, now + duration - 0.1);
    sirenGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const sirenFilter = audioContext.createBiquadFilter();
    sirenFilter.type = 'lowpass';
    sirenFilter.frequency.value = 1500;
    
    // Engine rumble approach
    const engineOsc = audioContext.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.setValueAtTime(50, now);
    engineOsc.frequency.linearRampToValueAtTime(80, now + duration);
    
    const engineGain = audioContext.createGain();
    engineGain.gain.setValueAtTime(0, now);
    engineGain.gain.linearRampToValueAtTime(volumes.warning * 0.2, now + 0.5);
    engineGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const engineFilter = audioContext.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 200;
    
    // Connect
    sirenOsc.connect(sirenFilter);
    sirenFilter.connect(sirenGain);
    sirenGain.connect(audioContext.destination);
    
    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(audioContext.destination);
    
    // Start
    sirenOsc.start(now);
    sirenOsc.stop(now + duration);
    engineOsc.start(now);
    engineOsc.stop(now + duration);
  });
}

// Low health warning beep
let lowHealthBeepInterval = null;
export function startLowHealthWarning() {
  if (lowHealthBeepInterval) return;
  
  const playBeep = () => {
    safePlay(() => {
      const now = audioContext.currentTime;
      
      const beepOsc = audioContext.createOscillator();
      beepOsc.type = 'sine';
      beepOsc.frequency.value = 880;
      
      const beepGain = audioContext.createGain();
      beepGain.gain.setValueAtTime(0, now);
      beepGain.gain.linearRampToValueAtTime(volumes.warning * 0.15, now + 0.01);
      beepGain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      
      beepOsc.connect(beepGain);
      beepGain.connect(audioContext.destination);
      
      beepOsc.start(now);
      beepOsc.stop(now + 0.1);
    });
  };
  
  playBeep();
  lowHealthBeepInterval = setInterval(playBeep, 500);
}

export function stopLowHealthWarning() {
  if (lowHealthBeepInterval) {
    clearInterval(lowHealthBeepInterval);
    lowHealthBeepInterval = null;
  }
}

// Game over sound
export function playGameOverSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    const duration = 1.5;
    
    // Descending doom tone
    const doomOsc = audioContext.createOscillator();
    doomOsc.type = 'sawtooth';
    doomOsc.frequency.setValueAtTime(300, now);
    doomOsc.frequency.exponentialRampToValueAtTime(50, now + duration);
    
    const doomGain = audioContext.createGain();
    doomGain.gain.setValueAtTime(0, now);
    doomGain.gain.linearRampToValueAtTime(volumes.feedback * 0.5, now + 0.05);
    doomGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const doomFilter = audioContext.createBiquadFilter();
    doomFilter.type = 'lowpass';
    doomFilter.frequency.setValueAtTime(2000, now);
    doomFilter.frequency.exponentialRampToValueAtTime(100, now + duration);
    
    // Dissonant chord
    const chordFreqs = [200, 237, 283]; // Minor second cluster
    chordFreqs.forEach(freq => {
      const osc = audioContext.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, now + duration);
      
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volumes.feedback * 0.15, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.start(now);
      osc.stop(now + duration);
    });
    
    // Static noise (death fizzle)
    const noiseBuffer = createNoiseBuffer(duration, 0.5);
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now + 0.5);
    noiseGain.gain.linearRampToValueAtTime(volumes.feedback * 0.2, now + 0.7);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 500;
    noiseFilter.Q.value = 1;
    
    // Connect
    doomOsc.connect(doomFilter);
    doomFilter.connect(doomGain);
    doomGain.connect(audioContext.destination);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    
    // Start
    doomOsc.start(now);
    doomOsc.stop(now + duration);
    noiseSource.start(now);
    noiseSource.stop(now + duration);
  });
}

// Weapon cycle click
export function playWeaponCycleSound() {
  safePlay(() => {
    const now = audioContext.currentTime;
    
    // Mechanical click
    const clickOsc = audioContext.createOscillator();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1800, now);
    clickOsc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
    
    const clickGain = audioContext.createGain();
    clickGain.gain.setValueAtTime(0, now);
    clickGain.gain.linearRampToValueAtTime(volumes.feedback * 0.25, now + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    // Connect
    clickOsc.connect(clickGain);
    clickGain.connect(audioContext.destination);
    
    // Start
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);
  });
}
