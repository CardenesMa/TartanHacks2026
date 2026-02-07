// audio.js — Sound effects using Web Audio API
// Each sound is procedurally generated - edit frequencies, durations, and volumes to customize


var Audio = (function () {
    var audioContext = null;
    // Initialize audio context on first user interaction
    function getContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    // Helper to create and play a tone with ADSR envelope
    /**
     * ADSR Envelope - Controls how sound volume changes over time
     * @param {number} attack - Time to reach peak volume (seconds)
     * @param {number} decay - Time to fall from peak to sustain (seconds)
     * @param {number} sustain - Volume level to maintain (0-1)
     * @param {number} release - Time to fade to silence (seconds)
     * @param {number} peakVolume - Maximum volume at attack peak (0-1)
     * @param {GainNode} gainNode - The gain node to apply envelope to
     * @param {number} startTime - When to start the envelope
     */
    function applyADSR(attack, decay, sustain, release, peakVolume, gainNode, startTime) {
        var ctx = getContext();
        var now = startTime || ctx.currentTime;

        // Start from silence
        gainNode.gain.setValueAtTime(0.001, now);

        // Attack: ramp up to peak volume
        gainNode.gain.exponentialRampToValueAtTime(peakVolume, now + attack);

        // Decay: fall to sustain level
        gainNode.gain.exponentialRampToValueAtTime(sustain, now + attack + decay);

        // Sustain is maintained until release
        // Release: fade to silence
        var releaseStart = now + attack + decay;
        gainNode.gain.setValueAtTime(sustain, releaseStart);
        gainNode.gain.exponentialRampToValueAtTime(0.001, releaseStart + release);

        return releaseStart + release; // Return total duration
    }

    // Helper to create and play a tone
    function playTone(frequency, duration, type, volumeStart, volumeEnd) {
        var ctx = getContext();
        var oscillator = ctx.createOscillator();
        var gainNode = ctx.createGain();

        oscillator.type = type || 'sine';
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        gainNode.gain.setValueAtTime(volumeStart || 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(volumeEnd || 0.01, ctx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }

    // Helper to play tone with ADSR envelope
    function playToneADSR(frequency, attack, decay, sustain, release, peakVolume, type) {
        var ctx = getContext();
        var oscillator = ctx.createOscillator();
        var gainNode = ctx.createGain();

        oscillator.type = type || 'sine';
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        var totalDuration = applyADSR(attack, decay, sustain, release, peakVolume, gainNode, ctx.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(totalDuration);
    }

    // ===== CUSTOMIZABLE SOUNDS =====
    // Edit these functions to change the sound characteristics

    /**
     * TILE CLICK - Light, short click sound
     * Edit: frequency (pitch), duration (length), type (waveform)
     */
    function tileClick() {
        playToneADSR(
            2400,        // Frequency in Hz (higher = higher pitch)
            0.001, // attack
            0.08, // D 
            0.05, // S 
            0.13, // R 
            1,
            // 0.08,       // Duration in seconds
            // 'triangle',     // Waveform: 'sine', 'square', 'sawtooth', 'triangle'
            // 0.,       // Start volume (0-1)
            // 0.01        // End volume (0-1)
        );
    }

    /**
     * SWAP - Two-tone swoosh sound when tiles swap
     * Edit: frequencies, durations, delay between tones
     * 
     * Alternative using playTwoTones (cleaner, no setTimeout):
     * playTwoTones(400, 0.12, 600, 0.15, 'sine', 0.25);
     * 
     * Alternative with lowpass filter (warmer sound):
     * playToneWithLowpass(500, 0.3, 800, 2, 'sawtooth', 0.2);
     */
    function swap() {
        var ctx = getContext();

        // First tone - rising
        playTone(400, 0.12, 'sine', 0.2, 0.01);

        // Second tone - falling (slight delay)
        setTimeout(function () {
            playTone(600, 0.15, 'sine', 0.25, 0.01);
        }, 60);
    }

    /**
     * BUTTON CLICK - Sharp, satisfying click
     * Edit: frequencies, volume, timing
     * 
     * Alternative using playTwoTones:
     * playTwoTones(1200, 0.05, 200, 0.1, 'sine', 0.15);
     */
    function buttonClick() {
        var ctx = getContext();
        playToneADSR
            (500,
                0.01,
                0.05,
                0.1,
                0.3,
                1,
                'sine');
    }



    // Public API
    return {
        tileClick: tileClick,
        swap: swap,
        buttonClick: buttonClick,
    };
})();
