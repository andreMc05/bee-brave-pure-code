// Web Audio API setup for rocket engine sound
let audioContext = null;
let engineNodes = {
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
let isEngineRunning = false;

// Initialize audio context (must be triggered by user interaction)
function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create master gain node for volume control
      engineNodes.masterGain = audioContext.createGain();
      engineNodes.masterGain.gain.value = 0.25; // Master volume
      engineNodes.masterGain.connect(audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }
  
  // Resume audio context if suspended (required for some browsers)
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(e => {
      console.warn('Could not resume audio context:', e);
    });
  }
}

// Start rocket engine sound
function startEngineSound() {
  if (!audioContext || isEngineRunning) return;
  
  try {
    // Create filters for rocket engine sound
    engineNodes.lowPassFilter = audioContext.createBiquadFilter();
    engineNodes.lowPassFilter.type = 'lowpass';
    engineNodes.lowPassFilter.frequency.value = 800; // Muffle high frequencies
    engineNodes.lowPassFilter.Q.value = 1;
    
    engineNodes.highPassFilter = audioContext.createBiquadFilter();
    engineNodes.highPassFilter.type = 'highpass';
    engineNodes.highPassFilter.frequency.value = 40; // Remove very low rumble
    engineNodes.highPassFilter.Q.value = 1;
    
    // Connect filters in chain: highpass -> lowpass -> master gain
    engineNodes.highPassFilter.connect(engineNodes.lowPassFilter);
    engineNodes.lowPassFilter.connect(engineNodes.masterGain);
    
    // 1. WHITE NOISE - Turbulent exhaust sound (main rocket engine character)
    engineNodes.noiseSource = audioContext.createBufferSource();
    const bufferSize = audioContext.sampleRate * 2;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1; // White noise
    }
    engineNodes.noiseSource.buffer = noiseBuffer;
    engineNodes.noiseSource.loop = true;
    
    // Gain for noise
    engineNodes.noiseGain = audioContext.createGain();
    engineNodes.noiseGain.gain.value = 0.4; // Noise volume
    
    engineNodes.noiseSource.connect(engineNodes.noiseGain);
    engineNodes.noiseGain.connect(engineNodes.highPassFilter);
    
    // 2. LOW FREQUENCY RUMBLE - Deep engine vibration
    engineNodes.rumbleOscillator = audioContext.createOscillator();
    engineNodes.rumbleOscillator.type = 'sawtooth';
    engineNodes.rumbleOscillator.frequency.value = 45; // Deep rumble
    
    // Gain for rumble
    engineNodes.rumbleGain = audioContext.createGain();
    engineNodes.rumbleGain.gain.value = 0.25; // Rumble volume
    
    engineNodes.rumbleOscillator.connect(engineNodes.rumbleGain);
    engineNodes.rumbleGain.connect(engineNodes.highPassFilter);
    
    // 3. PULSE MODULATION - Creates pulsing/thrust variation effect
    engineNodes.pulseOscillator = audioContext.createOscillator();
    engineNodes.pulseOscillator.type = 'sine';
    engineNodes.pulseOscillator.frequency.value = 3.2; // Pulse rate (Hz)
    
    // Modulate noise gain (volume pulsing)
    // Create constant source for base value
    if (typeof audioContext.createConstantSource === 'function') {
      const noiseBase = audioContext.createConstantSource();
      noiseBase.offset.value = 0.4; // Base noise gain
      noiseBase.connect(engineNodes.noiseGain.gain);
      noiseBase.start();
      engineNodes.noisePulseOffset = noiseBase;
    } else {
      // Fallback: set base value directly
      engineNodes.noiseGain.gain.value = 0.4;
    }
    
    const noisePulseGain = audioContext.createGain();
    noisePulseGain.gain.value = 0.15; // Pulse intensity (±0.15)
    engineNodes.pulseOscillator.connect(noisePulseGain);
    noisePulseGain.connect(engineNodes.noiseGain.gain);
    
    // Modulate rumble frequency (frequency variation)
    if (typeof audioContext.createConstantSource === 'function') {
      const rumbleBase = audioContext.createConstantSource();
      rumbleBase.offset.value = 45; // Base frequency
      rumbleBase.connect(engineNodes.rumbleOscillator.frequency);
      rumbleBase.start();
      engineNodes.rumbleFreqOffset = rumbleBase;
    } else {
      engineNodes.rumbleOscillator.frequency.value = 45;
    }
    
    const rumbleFreqMod = audioContext.createGain();
    rumbleFreqMod.gain.value = 8; // Frequency modulation amount (±8 Hz)
    engineNodes.pulseOscillator.connect(rumbleFreqMod);
    rumbleFreqMod.connect(engineNodes.rumbleOscillator.frequency);
    
    // Modulate low-pass filter frequency (dynamic filtering)
    if (typeof audioContext.createConstantSource === 'function') {
      const filterBase = audioContext.createConstantSource();
      filterBase.offset.value = 800; // Base filter frequency
      filterBase.connect(engineNodes.lowPassFilter.frequency);
      filterBase.start();
      engineNodes.filterOffset = filterBase;
    } else {
      engineNodes.lowPassFilter.frequency.value = 800;
    }
    
    const filterMod = audioContext.createGain();
    filterMod.gain.value = 120; // Filter modulation amount (±120 Hz)
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
function stopEngineSound() {
  if (!isEngineRunning) return;
  
  try {
    // Stop and disconnect all audio nodes
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
    
    // Disconnect filters
    if (engineNodes.lowPassFilter) {
      engineNodes.lowPassFilter.disconnect();
      engineNodes.lowPassFilter = null;
    }
    if (engineNodes.highPassFilter) {
      engineNodes.highPassFilter.disconnect();
      engineNodes.highPassFilter = null;
    }
    
    // Disconnect gain nodes
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
function playFireSound() {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return; // Still can't initialize
  }
  
  try {
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const now = audioContext.currentTime;
    const duration = 0.15; // Short burst sound (150ms)
    
    // Create a sharp "pew" sound using multiple oscillators
    // Main tone: high frequency sweep down
    const mainOsc = audioContext.createOscillator();
    mainOsc.type = 'sawtooth';
    mainOsc.frequency.setValueAtTime(800, now); // Start high
    mainOsc.frequency.exponentialRampToValueAtTime(400, now + duration); // Sweep down
    
    // Secondary tone: adds character
    const subOsc = audioContext.createOscillator();
    subOsc.type = 'square';
    subOsc.frequency.setValueAtTime(600, now);
    subOsc.frequency.exponentialRampToValueAtTime(300, now + duration);
    
    // Create gain envelope for sharp attack and quick decay
    const mainGain = audioContext.createGain();
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick attack
    mainGain.gain.exponentialRampToValueAtTime(0.01, now + duration); // Quick decay
    
    const subGain = audioContext.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Add a bit of noise for "crack" effect
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.3; // White noise
    }
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.1, now + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Low-pass filter for noise to make it less harsh
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 2000;
    
    // Connect everything
    mainOsc.connect(mainGain);
    subOsc.connect(subGain);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    
    mainGain.connect(audioContext.destination);
    subGain.connect(audioContext.destination);
    noiseGain.connect(audioContext.destination);
    
    // Start and stop sources
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
function playExplosionSound() {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return; // Still can't initialize
  }
  
  try {
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    const now = audioContext.currentTime;
    const duration = 1.2; // Longer explosion sound (1.2 seconds)
    
    // 1. LOW RUMBLE - Deep explosion bass
    const rumbleOsc = audioContext.createOscillator();
    rumbleOsc.type = 'sawtooth';
    rumbleOsc.frequency.setValueAtTime(40, now); // Very low frequency
    rumbleOsc.frequency.exponentialRampToValueAtTime(20, now + duration);
    
    const rumbleGain = audioContext.createGain();
    rumbleGain.gain.setValueAtTime(0, now);
    rumbleGain.gain.linearRampToValueAtTime(0.4, now + 0.05); // Quick attack
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Low-pass filter for rumble
    const rumbleFilter = audioContext.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 200;
    rumbleFilter.Q.value = 1;
    
    // 2. EXPLOSION NOISE - White noise burst
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.8; // Strong white noise
    }
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.02); // Very quick attack
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.6); // Decay faster
    
    // Band-pass filter for noise to make it sound more explosive
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 800;
    noiseFilter.Q.value = 2;
    
    // 3. HIGH FREQUENCY CRACK - Sharp initial burst
    const crackOsc = audioContext.createOscillator();
    crackOsc.type = 'square';
    crackOsc.frequency.setValueAtTime(2000, now);
    crackOsc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    
    const crackGain = audioContext.createGain();
    crackGain.gain.setValueAtTime(0, now);
    crackGain.gain.linearRampToValueAtTime(0.3, now + 0.005); // Instant attack
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); // Quick decay
    
    // 4. REVERB/ECHO EFFECT - Create multiple delayed copies for depth
    const delay1 = audioContext.createDelay(0.5);
    delay1.delayTime.value = 0.1;
    const delayGain1 = audioContext.createGain();
    delayGain1.gain.value = 0.3;
    
    const delay2 = audioContext.createDelay(0.5);
    delay2.delayTime.value = 0.2;
    const delayGain2 = audioContext.createGain();
    delayGain2.gain.value = 0.15;
    
    // Connect rumble
    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(audioContext.destination);
    
    // Connect noise
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioContext.destination);
    
    // Connect crack
    crackOsc.connect(crackGain);
    crackGain.connect(audioContext.destination);
    
    // Add delay effects to noise for depth
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

