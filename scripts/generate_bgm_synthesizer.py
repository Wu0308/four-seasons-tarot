import os
import math
import wave
import struct
import subprocess
import numpy as np
from scipy import signal

SAMPLE_RATE = 44100
DURATION = 90.0  # 90 seconds duration
NUM_SAMPLES = int(SAMPLE_RATE * DURATION)
TIME = np.linspace(0, DURATION, NUM_SAMPLES, endpoint=False)

def note_freq(name):
    notes = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
             'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
             'A#': 10, 'Bb': 10, 'B': 11}
    letter = name[:-1]
    octave = int(name[-1])
    semitone = notes[letter] + (octave - 4) * 12 - 9
    return 440.0 * (2.0 ** (semitone / 12.0))

# ---------------------------------------------------------------------------
# Acoustic Synthesis Primitives
# ---------------------------------------------------------------------------

def render_piano_note(buffer, t_start, freq, duration, vel=0.7, pan=0.5):
    start_idx = int(t_start * SAMPLE_RATE)
    if start_idx >= NUM_SAMPLES:
        return
    n_samples = min(int(duration * SAMPLE_RATE), NUM_SAMPLES - start_idx)
    t = np.linspace(0, n_samples / SAMPLE_RATE, n_samples, endpoint=False)
    
    # Felt piano envelope: smooth attack, warm decay
    attack = np.minimum(1.0, t / 0.015)
    decay = np.exp(-t * (1.2 + freq * 0.001))
    env = attack * decay * vel
    
    # Multi-harmonic series with slight inharmonicity
    harmonics = (
        1.00 * np.sin(2 * np.pi * freq * t) +
        0.48 * np.sin(2 * np.pi * freq * 2.002 * t) +
        0.24 * np.sin(2 * np.pi * freq * 3.005 * t) +
        0.12 * np.sin(2 * np.pi * freq * 4.009 * t) +
        0.05 * np.sin(2 * np.pi * freq * 5.014 * t)
    )
    sig = harmonics * env
    
    # Felt lowpass filter (2200 Hz)
    sos = signal.butter(2, 2200, 'lowpass', fs=SAMPLE_RATE, output='sos')
    sig_filtered = signal.sosfilt(sos, sig)
    
    buffer[0, start_idx:start_idx + n_samples] += sig_filtered * (1.0 - pan)
    buffer[1, start_idx:start_idx + n_samples] += sig_filtered * pan

def render_harp_harmonic(buffer, t_start, freq, vel=0.45, pan=0.5):
    start_idx = int(t_start * SAMPLE_RATE)
    if start_idx >= NUM_SAMPLES:
        return
    dur = 4.0
    n_samples = min(int(dur * SAMPLE_RATE), NUM_SAMPLES - start_idx)
    t = np.linspace(0, n_samples / SAMPLE_RATE, n_samples, endpoint=False)
    
    env = np.exp(-t * 2.2) * vel
    sig = (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2.0 * t)) * env
    buffer[0, start_idx:start_idx + n_samples] += sig * (1.0 - pan)
    buffer[1, start_idx:start_idx + n_samples] += sig * pan

def render_rhodes_chord(buffer, t_start, freqs, duration, vel=0.5):
    start_idx = int(t_start * SAMPLE_RATE)
    if start_idx >= NUM_SAMPLES:
        return
    n_samples = min(int(duration * SAMPLE_RATE), NUM_SAMPLES - start_idx)
    t = np.linspace(0, n_samples / SAMPLE_RATE, n_samples, endpoint=False)
    
    attack = np.minimum(1.0, t / 0.02)
    decay = np.exp(-t * 0.75)
    env = attack * decay * vel
    
    # 4.5 Hz Stereo Tremolo
    trem_l = 0.5 + 0.35 * np.sin(2 * np.pi * 4.5 * t)
    trem_r = 0.5 + 0.35 * np.sin(2 * np.pi * 4.5 * t + np.pi)
    
    chord_sig = np.zeros(n_samples)
    for f in freqs:
        # Bell tine overtone at 7x frequency
        tone = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * f * 7.0 * t) * np.exp(-t * 4.0)
        chord_sig += tone
        
    buffer[0, start_idx:start_idx + n_samples] += chord_sig * env * trem_l
    buffer[1, start_idx:start_idx + n_samples] += chord_sig * env * trem_r

def render_cello_line(buffer, note_events):
    for t_start, dur, freq, vel in note_events:
        start_idx = int(t_start * SAMPLE_RATE)
        if start_idx >= NUM_SAMPLES:
            continue
        n_samples = min(int(dur * SAMPLE_RATE), NUM_SAMPLES - start_idx)
        t = np.linspace(0, n_samples / SAMPLE_RATE, n_samples, endpoint=False)
        
        # 5.2 Hz Expressive Vibrato
        vibrato = 1.0 + 0.007 * np.sin(2 * np.pi * 5.2 * t)
        inst_freq = freq * vibrato
        phase = 2 * np.pi * np.cumsum(inst_freq) / SAMPLE_RATE
        
        # Bow envelope
        att_len = int(0.55 * SAMPLE_RATE)
        rel_len = int(0.70 * SAMPLE_RATE)
        env = np.ones(n_samples)
        if n_samples > att_len:
            env[:att_len] = np.linspace(0, 1, att_len)
        if n_samples > rel_len:
            env[-rel_len:] = np.linspace(1, 0, rel_len)
            
        bowed = (
            1.00 * np.sin(phase) +
            0.50 * np.sin(phase * 2) +
            0.30 * np.sin(phase * 3) +
            0.18 * np.sin(phase * 4) +
            0.10 * np.sin(phase * 5)
        ) * env * vel * 0.4
        
        # Body formant filter
        sos = signal.butter(2, [200, 1600], 'bandpass', fs=SAMPLE_RATE, output='sos')
        sig_filtered = signal.sosfilt(sos, bowed)
        
        buffer[0, start_idx:start_idx + n_samples] += sig_filtered * 0.55
        buffer[1, start_idx:start_idx + n_samples] += sig_filtered * 0.45

def render_guitar_pluck(buffer, t_start, freq, vel=0.6, pan=0.5):
    start_idx = int(t_start * SAMPLE_RATE)
    if start_idx >= NUM_SAMPLES:
        return
    dur = 3.5
    n_samples = min(int(dur * SAMPLE_RATE), NUM_SAMPLES - start_idx)
    t = np.linspace(0, n_samples / SAMPLE_RATE, n_samples, endpoint=False)
    
    decay = np.exp(-t * (2.8 + freq * 0.002))
    harmonics = (
        1.00 * np.sin(2 * np.pi * freq * t) +
        0.65 * np.sin(2 * np.pi * freq * 2.001 * t) +
        0.35 * np.sin(2 * np.pi * freq * 3.004 * t) +
        0.18 * np.sin(2 * np.pi * freq * 4.008 * t)
    )
    sig = harmonics * decay * vel * 0.5
    buffer[0, start_idx:start_idx + n_samples] += sig * (1.0 - pan)
    buffer[1, start_idx:start_idx + n_samples] += sig * pan

def render_celesta_glass(buffer, t_start, freq, vel=0.5, pan=0.5):
    start_idx = int(t_start * SAMPLE_RATE)
    if start_idx >= NUM_SAMPLES:
        return
    dur = 4.5
    n_samples = min(int(dur * SAMPLE_RATE), NUM_SAMPLES - start_idx)
    t = np.linspace(0, n_samples / SAMPLE_RATE, n_samples, endpoint=False)
    
    decay = np.exp(-t * 0.95)
    # Inharmonic crystal glass ratios: 1.0, 2.756, 4.072, 5.431
    sig = (
        1.00 * np.sin(2 * np.pi * freq * t) +
        0.38 * np.sin(2 * np.pi * freq * 2.756 * t) +
        0.22 * np.sin(2 * np.pi * freq * 4.072 * t) +
        0.12 * np.sin(2 * np.pi * freq * 5.431 * t)
    ) * decay * vel * 0.35
    buffer[0, start_idx:start_idx + n_samples] += sig * (1.0 - pan)
    buffer[1, start_idx:start_idx + n_samples] += sig * pan

# ---------------------------------------------------------------------------
# Ambient Soundscape Textures
# ---------------------------------------------------------------------------

def generate_morning_breeze():
    noise = np.random.normal(0, 0.04, NUM_SAMPLES)
    sos = signal.butter(2, [350, 850], 'bandpass', fs=SAMPLE_RATE, output='sos')
    filtered = signal.sosfilt(sos, noise)
    lfo = 0.5 + 0.45 * np.sin(2 * np.pi * 0.12 * TIME)
    return filtered * lfo

def generate_ocean_midnight_waves():
    noise = np.random.normal(0, 0.05, NUM_SAMPLES)
    sos = signal.butter(2, [120, 580], 'bandpass', fs=SAMPLE_RATE, output='sos')
    filtered = signal.sosfilt(sos, noise)
    # Slow 9.5-second tidal cycle
    tide_env = (np.sin(2 * np.pi * (1 / 9.5) * TIME) * 0.5 + 0.5) ** 1.8
    return filtered * tide_env

def generate_autumn_rain():
    # Continuous rain noise
    noise = np.random.normal(0, 0.035, NUM_SAMPLES)
    sos = signal.butter(2, [500, 4800], 'bandpass', fs=SAMPLE_RATE, output='sos')
    rain_base = signal.sosfilt(sos, noise)
    # Raindrop droplets
    drops = np.zeros(NUM_SAMPLES)
    num_drops = int(DURATION * 18)
    drop_indices = np.random.randint(0, NUM_SAMPLES - 1000, num_drops)
    t_drop = np.linspace(0, 0.02, 882)
    drop_wave = np.sin(2 * np.pi * 1400 * t_drop) * np.exp(-t_drop * 180) * 0.04
    for idx in drop_indices:
        drops[idx:idx + 882] += drop_wave
    return rain_base + drops

def generate_winter_frost_whisper():
    noise = np.random.normal(0, 0.025, NUM_SAMPLES)
    sos = signal.butter(2, [2800, 7200], 'bandpass', fs=SAMPLE_RATE, output='sos')
    filtered = signal.sosfilt(sos, noise)
    breathe = 0.5 + 0.35 * np.sin(2 * np.pi * 0.08 * TIME)
    return filtered * breathe

# ---------------------------------------------------------------------------
# Reverb & Master Processing
# ---------------------------------------------------------------------------

def apply_lush_reverb(stereo_audio, room_mix=0.35):
    l = stereo_audio[0]
    r = stereo_audio[1]
    
    delays_l = [int(0.029 * SAMPLE_RATE), int(0.043 * SAMPLE_RATE), int(0.067 * SAMPLE_RATE)]
    delays_r = [int(0.031 * SAMPLE_RATE), int(0.047 * SAMPLE_RATE), int(0.071 * SAMPLE_RATE)]
    gains = [0.42, 0.30, 0.20]
    
    rev_l = np.zeros_like(l)
    rev_r = np.zeros_like(r)
    for d, g in zip(delays_l, gains):
        rev_l[d:] += l[:-d] * g
    for d, g in zip(delays_r, gains):
        rev_r[d:] += r[:-d] * g
        
    out_l = l * (1.0 - room_mix) + rev_l * room_mix
    out_r = r * (1.0 - room_mix) + rev_r * room_mix
    return np.array([out_l, out_r])

def master_fade(stereo_audio):
    fade_len = int(1.8 * SAMPLE_RATE)
    env = np.ones(NUM_SAMPLES)
    env[:fade_len] = np.linspace(0, 1, fade_len)
    env[-fade_len:] = np.linspace(1, 0, fade_len)
    return stereo_audio * env

def export_mp3(stereo_audio, mp3_path):
    peak = np.max(np.abs(stereo_audio))
    if peak > 0:
        norm_audio = (stereo_audio / peak) * 0.88
    else:
        norm_audio = stereo_audio
        
    pcm_l = (norm_audio[0] * 32767).astype(np.int16)
    pcm_r = (norm_audio[1] * 32767).astype(np.int16)
    
    interleaved = np.empty((NUM_SAMPLES * 2,), dtype=np.int16)
    interleaved[0::2] = pcm_l
    interleaved[1::2] = pcm_r
    
    wav_path = mp3_path.replace('.mp3', '.wav')
    with wave.open(wav_path, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(interleaved.tobytes())
        
    cmd = [
        'ffmpeg', '-y', '-i', wav_path,
        '-codec:a', 'libmp3lame', '-b:a', '192k',
        mp3_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if os.path.exists(wav_path):
        os.remove(wav_path)
    file_size_kb = os.path.getsize(mp3_path) / 1024
    print(f"Generated {mp3_path} ({file_size_kb:.1f} KB, {DURATION:.0f}s)")

# ---------------------------------------------------------------------------
# Four Seasons Compositions (90s each)
# ---------------------------------------------------------------------------

def compose_spring(output_path):
    print("Composing Track 1: 春・初綻 (spring-piano.mp3)...")
    buffer = np.zeros((2, NUM_SAMPLES))
    
    # 72 BPM = 0.8333s per beat, 3.333s per measure
    beat = 60.0 / 72.0
    
    # Chord patterns (Fmaj9 -> Am9 -> Bbmaj7#11 -> C9sus4 -> Dm9 -> Gm9 -> Csus4 -> Fmaj9)
    progressions = [
        # Phrase 1 (0 - 26s)
        ('F3', ['C4', 'E4', 'G4', 'A4'], 0.0),
        ('A2', ['E3', 'G3', 'B3', 'C4'], 6.6),
        ('Bb2', ['F3', 'A3', 'C4', 'E4'], 13.3),
        ('C3', ['G3', 'Bb3', 'D4', 'F4'], 20.0),
        # Phrase 2 (26 - 53s)
        ('D3', ['A3', 'C4', 'E4', 'F4'], 26.6),
        ('G2', ['D3', 'F3', 'A3', 'Bb3'], 33.3),
        ('C3', ['G3', 'C4', 'E4', 'G4'], 40.0),
        ('F2', ['C3', 'A3', 'C4', 'E4'], 46.6),
        # Phrase 3 - Poetic modulation (53 - 73s)
        ('Db3', ['Ab3', 'C4', 'Eb4', 'F4'], 53.3),
        ('Eb3', ['Bb3', 'D4', 'F4', 'G4'], 60.0),
        ('F3', ['C4', 'E4', 'G4', 'A4'], 66.6),
        # Outro return (73 - 90s)
        ('Bb2', ['F3', 'A3', 'C4', 'D4'], 73.3),
        ('C3', ['G3', 'D4', 'E4', 'G4'], 80.0),
        ('F2', ['C3', 'F3', 'A3', 'C4', 'E4'], 85.0)
    ]
    
    for bass, treble, t_start in progressions:
        # Bass root note
        render_piano_note(buffer, t_start, note_freq(bass), 6.0, vel=0.82, pan=0.45)
        # Gentle arpeggiated felt treble chords
        for idx, note in enumerate(treble):
            t_note = t_start + 0.6 + idx * 0.7
            pan = 0.35 + 0.08 * idx
            render_piano_note(buffer, t_note, note_freq(note), 4.5, vel=0.68 - idx * 0.03, pan=pan)
            
    # Delicate acoustic harp harmonics floating like cherry blossoms
    harp_moments = [
        (4.5, 'C6'), (11.0, 'E6'), (17.5, 'A5'), (24.0, 'G6'),
        (31.0, 'F6'), (38.0, 'D6'), (45.0, 'E6'), (51.5, 'C6'),
        (57.5, 'Eb6'), (64.0, 'F6'), (70.5, 'A6'), (78.0, 'G6'), (84.5, 'E6')
    ]
    for t_harp, n in harp_moments:
        render_harp_harmonic(buffer, t_harp, note_freq(n), vel=0.42, pan=0.65)
        
    # Morning breeze texture
    breeze = generate_morning_breeze()
    buffer[0] += breeze * 0.8
    buffer[1] += breeze * 0.8
    
    processed = apply_lush_reverb(buffer, room_mix=0.28)
    final_audio = master_fade(processed)
    export_mp3(final_audio, output_path)

def compose_summer(output_path):
    print("Composing Track 2: 夏・仲夜 (summer-night.mp3)...")
    buffer = np.zeros((2, NUM_SAMPLES))
    
    # 65 BPM = 0.923s per beat, 3.692s per measure
    rhodes_chords = [
        # Dm11 (0 - 15s)
        (0.0, [note_freq('D3'), note_freq('A3'), note_freq('C4'), note_freq('E4'), note_freq('G4')], 14.5),
        # Bbmaj9 (15 - 30s)
        (15.0, [note_freq('Bb2'), note_freq('F3'), note_freq('A3'), note_freq('C4'), note_freq('D4')], 14.5),
        # Gm9 (30 - 45s)
        (30.0, [note_freq('G2'), note_freq('D3'), note_freq('F3'), note_freq('A3'), note_freq('Bb3')], 14.5),
        # Asus4(b9) (45 - 60s)
        (45.0, [note_freq('A2'), note_freq('E3'), note_freq('G3'), note_freq('Bb3'), note_freq('D4')], 14.5),
        # Fmaj9 (60 - 75s)
        (60.0, [note_freq('F2'), note_freq('C3'), note_freq('E3'), note_freq('A3'), note_freq('C4')], 14.5),
        # Dm9 resolve (75 - 90s)
        (75.0, [note_freq('D2'), note_freq('A2'), note_freq('C3'), note_freq('E3'), note_freq('F3')], 14.5)
    ]
    for t_start, freqs, dur in rhodes_chords:
        render_rhodes_chord(buffer, t_start, freqs, dur, vel=0.48)
        
    # Lyrical solo cello melody
    cello_melody = [
        (2.0, 6.0, note_freq('A3'), 0.75),
        (8.5, 5.5, note_freq('F3'), 0.70),
        (14.5, 7.0, note_freq('D3'), 0.80),
        (22.0, 5.0, note_freq('C4'), 0.75),
        (27.5, 6.0, note_freq('D4'), 0.82),
        (34.0, 7.0, note_freq('Bb3'), 0.75),
        (41.5, 6.5, note_freq('G3'), 0.78),
        (48.5, 7.5, note_freq('E3'), 0.80),
        (56.5, 6.5, note_freq('F3'), 0.76),
        (63.5, 7.0, note_freq('A3'), 0.82),
        (71.0, 6.5, note_freq('C4'), 0.75),
        (78.0, 10.0, note_freq('D3'), 0.85)
    ]
    render_cello_line(buffer, cello_melody)
    
    # Ocean waves & night breeze ambience
    waves = generate_ocean_midnight_waves()
    buffer[0] += waves * 0.7
    buffer[1] += waves * 0.7
    
    processed = apply_lush_reverb(buffer, room_mix=0.38)
    final_audio = master_fade(processed)
    export_mp3(final_audio, output_path)

def compose_autumn(output_path):
    print("Composing Track 3: 秋・暮光 (autumn-rain.mp3)...")
    buffer = np.zeros((2, NUM_SAMPLES))
    
    # 68 BPM = 0.882s per beat
    # Acoustic fingerstyle guitar plucks
    guitar_patterns = [
        # Cmaj7 (0 - 15s)
        ('C3', ['E3', 'G3', 'B3', 'E4'], 0.0),
        ('C3', ['E3', 'G3', 'B3', 'D4'], 7.5),
        # Em7 (15 - 30s)
        ('E2', ['B2', 'E3', 'G3', 'D4'], 15.0),
        ('E2', ['B2', 'G3', 'B3', 'E4'], 22.5),
        # Fmaj7 (30 - 45s)
        ('F2', ['C3', 'E3', 'A3', 'C4'], 30.0),
        ('F2', ['C3', 'A3', 'C4', 'E4'], 37.5),
        # Gsus4 -> G7 (45 - 60s)
        ('G2', ['D3', 'G3', 'C4', 'D4'], 45.0),
        ('G2', ['D3', 'F3', 'B3', 'D4'], 52.5),
        # Am9 (60 - 75s)
        ('A2', ['E3', 'G3', 'B3', 'C4'], 60.0),
        ('A2', ['E3', 'A3', 'C4', 'E4'], 67.5),
        # Fmaj7 -> Cmaj9 resolve (75 - 90s)
        ('F2', ['C3', 'A3', 'C4', 'E4'], 75.0),
        ('C3', ['G3', 'B3', 'D4', 'E4'], 82.5)
    ]
    
    for bass, treble, t_start in guitar_patterns:
        # Bass pluck
        render_guitar_pluck(buffer, t_start, note_freq(bass), vel=0.78, pan=0.4)
        # Treble fingerstyle pattern
        for idx, n in enumerate(treble):
            t_p = t_start + 0.45 + idx * 0.55
            pan = 0.45 + 0.08 * idx
            render_guitar_pluck(buffer, t_p, note_freq(n), vel=0.62 - idx * 0.03, pan=pan)
            
    # Soft upright piano accompaniment chords entering on downbeats
    piano_chords = [
        (3.5, ['C4', 'E4', 'G4']), (18.5, ['B3', 'E4', 'G4']),
        (33.5, ['A3', 'C4', 'E4']), (48.5, ['G3', 'B3', 'D4']),
        (63.5, ['G3', 'C4', 'E4']), (78.5, ['E4', 'G4', 'B4'])
    ]
    for t_c, notes in piano_chords:
        for idx, n in enumerate(notes):
            render_piano_note(buffer, t_c + idx * 0.08, note_freq(n), 5.5, vel=0.55, pan=0.6)
            
    # Autumn rain on windowpane ambience
    rain = generate_autumn_rain()
    buffer[0] += rain * 0.65
    buffer[1] += rain * 0.65
    
    # Warm analog tape saturation & filtering
    buffer = np.tanh(buffer * 1.15)
    processed = apply_lush_reverb(buffer, room_mix=0.32)
    final_audio = master_fade(processed)
    export_mp3(final_audio, output_path)

def compose_winter(output_path):
    print("Composing Track 4: 冬・初雪 (winter-silence.mp3)...")
    buffer = np.zeros((2, NUM_SAMPLES))
    
    # 60 BPM = 1.000s per beat
    # Deep sub-bass drones and warm atmospheric pads
    pad_progressions = [
        # Bm9 (0 - 24s)
        (0.0, [note_freq('B1'), note_freq('F#2'), note_freq('D3'), note_freq('F#3')], 23.5),
        # Gmaj7(#11) (24 - 48s)
        (24.0, [note_freq('G1'), note_freq('D2'), note_freq('F#3'), note_freq('B3'), note_freq('C#4')], 23.5),
        # Em9 (48 - 70s)
        (48.0, [note_freq('E1'), note_freq('B1'), note_freq('G2'), note_freq('D3'), note_freq('F#3')], 21.5),
        # Bm(add9) resolve (70 - 90s)
        (70.0, [note_freq('B1'), note_freq('F#2'), note_freq('C#3'), note_freq('D3'), note_freq('F#3')], 19.5)
    ]
    for t_start, freqs, dur in pad_progressions:
        start_idx = int(t_start * SAMPLE_RATE)
        n_samples = min(int(dur * SAMPLE_RATE), NUM_SAMPLES - start_idx)
        t = np.linspace(0, n_samples / SAMPLE_RATE, n_samples, endpoint=False)
        
        # Soft slow-evolving pad envelope
        att_len = int(2.5 * SAMPLE_RATE)
        rel_len = int(3.0 * SAMPLE_RATE)
        env = np.ones(n_samples)
        if n_samples > att_len:
            env[:att_len] = np.linspace(0, 1, att_len)
        if n_samples > rel_len:
            env[-rel_len:] = np.linspace(1, 0, rel_len)
            
        pad_sig = np.zeros(n_samples)
        for f in freqs:
            pad_sig += (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t))
            
        buffer[0, start_idx:start_idx + n_samples] += pad_sig * env * 0.22
        buffer[1, start_idx:start_idx + n_samples] += pad_sig * env * 0.22
        
    # Crystalline celesta and sparse high-register glass notes
    glass_moments = [
        (3.0, 'B5'), (8.5, 'D#6'), (15.0, 'F#6'), (20.5, 'G#5'),
        (27.0, 'B5'), (32.5, 'C#6'), (39.0, 'E6'), (45.5, 'D#6'),
        (52.0, 'F#6'), (58.5, 'B5'), (65.0, 'A#5'), (72.5, 'C#6'),
        (79.0, 'D#6'), (84.5, 'B5')
    ]
    for t_glass, n in glass_moments:
        pan = 0.5 + 0.35 * np.sin(t_glass * 1.8)
        render_celesta_glass(buffer, t_glass, note_freq(n), vel=0.48, pan=pan)
        
    # Winter frost silence whisper
    frost = generate_winter_frost_whisper()
    buffer[0] += frost * 0.75
    buffer[1] += frost * 0.75
    
    # Deep spacious cathedral Nordic reverb
    processed = apply_lush_reverb(buffer, room_mix=0.45)
    final_audio = master_fade(processed)
    export_mp3(final_audio, output_path)

def main():
    target_dir = os.path.join(os.path.dirname(__file__), 'assets', 'audio')
    os.makedirs(target_dir, exist_ok=True)
    
    print(f"=== Generating 4 Seasons High-Fidelity BGM ({DURATION:.0f}s per track, 192kbps MP3) ===")
    compose_spring(os.path.join(target_dir, 'spring-piano.mp3'))
    compose_summer(os.path.join(target_dir, 'summer-night.mp3'))
    compose_autumn(os.path.join(target_dir, 'autumn-rain.mp3'))
    compose_winter(os.path.join(target_dir, 'winter-silence.mp3'))
    print("=== All 4 Seasonal BGM Tracks Successfully Generated ===")

if __name__ == '__main__':
    main()
