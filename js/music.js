// ========================================
// Background Music System - Procedural Ambient
// ========================================

let musicContext = null;
let musicNodes = {
  masterGain: null,
  bassOsc: null,
  bassGain: null,
  padOsc1: null,
  padOsc2: null,
  padGain: null,
  arpOsc: null,
  arpGain: null,
  filter: null,
  reverb: null
};

let isPlaying = false;
let musicVolume = 0.3;
let arpInterval = null;

// Chord progressions for ambient feel (frequencies in Hz)
const chords = [
  [130.81, 164.81, 196.00], // C major
  [110.00, 138.59, 164.81], // A minor
  [146.83, 185.00, 220.00], // D minor
  [130.81, 155.56, 196.00], // C sus4 -> C
];
let currentChordIndex = 0;

// Arpeggio notes
const arpNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
let arpNoteIndex = 0;

// Initialize music context
export function initMusicContext() {
  if (!musicContext) {
    try {
      musicContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported for music:', e);
      return false;
    }
  }
  
  if (musicContext && musicContext.state === 'suspended') {
    musicContext.resume().catch(e => {
      console.warn('Could not resume music context:', e);
    });
  }
  
  return true;
}

// Create reverb impulse response
function createReverbImpulse(duration = 2, decay = 2) {
  const sampleRate = musicContext.sampleRate;
  const length = sampleRate * duration;
  const impulse = musicContext.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  
  return impulse;
}

// Start background music
export function startMusic() {
  if (!initMusicContext() || isPlaying) return;
  
  try {
    // Master gain
    musicNodes.masterGain = musicContext.createGain();
    musicNodes.masterGain.gain.value = musicVolume;
    musicNodes.masterGain.connect(musicContext.destination);
    
    // Create reverb
    musicNodes.reverb = musicContext.createConvolver();
    musicNodes.reverb.buffer = createReverbImpulse(2.5, 2.5);
    
    const reverbGain = musicContext.createGain();
    reverbGain.gain.value = 0.4;
    musicNodes.reverb.connect(reverbGain);
    reverbGain.connect(musicNodes.masterGain);
    
    // Low-pass filter for warmth
    musicNodes.filter = musicContext.createBiquadFilter();
    musicNodes.filter.type = 'lowpass';
    musicNodes.filter.frequency.value = 2000;
    musicNodes.filter.Q.value = 0.5;
    musicNodes.filter.connect(musicNodes.masterGain);
    musicNodes.filter.connect(musicNodes.reverb);
    
    // Bass drone
    musicNodes.bassOsc = musicContext.createOscillator();
    musicNodes.bassOsc.type = 'sine';
    musicNodes.bassOsc.frequency.value = chords[0][0] / 2; // Sub bass
    
    musicNodes.bassGain = musicContext.createGain();
    musicNodes.bassGain.gain.value = 0.15;
    
    musicNodes.bassOsc.connect(musicNodes.bassGain);
    musicNodes.bassGain.connect(musicNodes.filter);
    
    // Pad oscillators (detuned for thickness)
    musicNodes.padOsc1 = musicContext.createOscillator();
    musicNodes.padOsc1.type = 'triangle';
    musicNodes.padOsc1.frequency.value = chords[0][1];
    
    musicNodes.padOsc2 = musicContext.createOscillator();
    musicNodes.padOsc2.type = 'triangle';
    musicNodes.padOsc2.frequency.value = chords[0][2];
    musicNodes.padOsc2.detune.value = 5; // Slight detune
    
    musicNodes.padGain = musicContext.createGain();
    musicNodes.padGain.gain.value = 0.08;
    
    musicNodes.padOsc1.connect(musicNodes.padGain);
    musicNodes.padOsc2.connect(musicNodes.padGain);
    musicNodes.padGain.connect(musicNodes.filter);
    
    // Arpeggiator oscillator
    musicNodes.arpOsc = musicContext.createOscillator();
    musicNodes.arpOsc.type = 'sine';
    musicNodes.arpOsc.frequency.value = arpNotes[0];
    
    musicNodes.arpGain = musicContext.createGain();
    musicNodes.arpGain.gain.value = 0;
    
    musicNodes.arpOsc.connect(musicNodes.arpGain);
    musicNodes.arpGain.connect(musicNodes.filter);
    
    // Start oscillators
    musicNodes.bassOsc.start();
    musicNodes.padOsc1.start();
    musicNodes.padOsc2.start();
    musicNodes.arpOsc.start();
    
    isPlaying = true;
    
    // Start chord progression
    startChordProgression();
    
    // Start arpeggiator
    startArpeggiator();
    
  } catch (e) {
    console.warn('Error starting music:', e);
  }
}

// Chord progression timing
function startChordProgression() {
  setInterval(() => {
    if (!isPlaying || !musicContext) return;
    
    currentChordIndex = (currentChordIndex + 1) % chords.length;
    const chord = chords[currentChordIndex];
    const now = musicContext.currentTime;
    
    // Smooth transition to new chord
    if (musicNodes.bassOsc) {
      musicNodes.bassOsc.frequency.setTargetAtTime(chord[0] / 2, now, 0.5);
    }
    if (musicNodes.padOsc1) {
      musicNodes.padOsc1.frequency.setTargetAtTime(chord[1], now, 0.5);
    }
    if (musicNodes.padOsc2) {
      musicNodes.padOsc2.frequency.setTargetAtTime(chord[2], now, 0.5);
    }
  }, 4000); // Change chord every 4 seconds
}

// Arpeggiator pattern
function startArpeggiator() {
  arpInterval = setInterval(() => {
    if (!isPlaying || !musicContext || !musicNodes.arpOsc || !musicNodes.arpGain) return;
    
    const now = musicContext.currentTime;
    
    // Play note with envelope
    musicNodes.arpGain.gain.cancelScheduledValues(now);
    musicNodes.arpGain.gain.setValueAtTime(0, now);
    musicNodes.arpGain.gain.linearRampToValueAtTime(0.06, now + 0.02);
    musicNodes.arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    // Move to next note
    arpNoteIndex = (arpNoteIndex + 1) % arpNotes.length;
    
    // Apply current chord root to arpeggio
    const chordRoot = chords[currentChordIndex][0];
    const noteMultiplier = chordRoot / 130.81; // Relative to C
    musicNodes.arpOsc.frequency.setValueAtTime(arpNotes[arpNoteIndex] * noteMultiplier, now);
    
  }, 300); // Arpeggio speed
}

// Stop background music
export function stopMusic() {
  if (!isPlaying) return;
  
  try {
    if (arpInterval) {
      clearInterval(arpInterval);
      arpInterval = null;
    }
    
    // Fade out
    if (musicNodes.masterGain && musicContext) {
      const now = musicContext.currentTime;
      musicNodes.masterGain.gain.setTargetAtTime(0, now, 0.3);
      
      // Stop after fade
      setTimeout(() => {
        cleanupMusicNodes();
      }, 500);
    } else {
      cleanupMusicNodes();
    }
    
    isPlaying = false;
  } catch (e) {
    console.warn('Error stopping music:', e);
    cleanupMusicNodes();
    isPlaying = false;
  }
}

// Cleanup nodes
function cleanupMusicNodes() {
  const oscillators = ['bassOsc', 'padOsc1', 'padOsc2', 'arpOsc'];
  oscillators.forEach(name => {
    if (musicNodes[name]) {
      try {
        musicNodes[name].stop();
      } catch (e) {}
      musicNodes[name] = null;
    }
  });
  
  const otherNodes = ['bassGain', 'padGain', 'arpGain', 'filter', 'reverb', 'masterGain'];
  otherNodes.forEach(name => {
    if (musicNodes[name]) {
      try {
        musicNodes[name].disconnect();
      } catch (e) {}
      musicNodes[name] = null;
    }
  });
}

// Set music volume (0-1)
export function setMusicVolume(volume) {
  musicVolume = Math.max(0, Math.min(1, volume));
  if (musicNodes.masterGain && musicContext) {
    musicNodes.masterGain.gain.setTargetAtTime(musicVolume, musicContext.currentTime, 0.1);
  }
}

// Get current volume
export function getMusicVolume() {
  return musicVolume;
}

// Toggle music on/off
export function toggleMusic() {
  if (isPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
  return isPlaying;
}

// Check if music is playing
export function isMusicPlaying() {
  return isPlaying;
}
