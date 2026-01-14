// ========================================
// Audio System - Web Audio API
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

// Initialize audio context (must be triggered by user interaction)
export function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain node for volume control
      engineNodes.masterGain = audioContext.createGain();
      engineNodes.masterGain.gain.value = 0.25;
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

// Play firing sound effect
export function playFireSound() {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return;
  }
  
  try {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
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
    mainGain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    mainGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const subGain = audioContext.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Noise for crack effect
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3;
    }
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
    
  } catch (e) {
    console.warn('Error playing fire sound:', e);
  }
}

// Play explosion sound effect
export function playExplosionSound() {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return;
  }
  
  try {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const now = audioContext.currentTime;
    const duration = 1.2;
    
    // LOW RUMBLE
    const rumbleOsc = audioContext.createOscillator();
    rumbleOsc.type = 'sawtooth';
    rumbleOsc.frequency.setValueAtTime(40, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(20, now + duration);
    
    const rumbleGain = audioContext.createGain();
    rumbleGain.gain.setValueAtTime(0, now);
    rumbleGain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    const rumbleFilter = audioContext.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 200;
    rumbleFilter.Q.value = 1;
    
    // EXPLOSION NOISE
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.8;
    }
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.02);
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
    crackGain.gain.linearRampToValueAtTime(0.3, now + 0.005);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    // DELAY EFFECTS
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
    
  } catch (e) {
    console.warn('Error playing explosion sound:', e);
  }
}
