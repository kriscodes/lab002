'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { KeyboardFace } from './keyboard-face';
import { Portrait } from './portrait';
import { miraScene, waveform } from '../scene/cues';
import { formatTime, getFaceFrame } from '../scene/timeline';

const layers = [
  {
    id: 'keyboard',
    name: 'Keyboard face',
    description: 'Speech and expression in keyboard characters.',
  },
  { id: 'mouth', name: 'Mouth only', description: 'The cartoon moves its lips and jaw.' },
  {
    id: 'full',
    name: 'Full face',
    description: 'The cartoon adds gaze, brows, movement, and tears.',
  },
] as const;

type Layer = (typeof layers)[number]['id'];

export function TalkingFaces() {
  const audio = useRef<HTMLAudioElement>(null);
  const [layer, setLayer] = useState<Layer>('full');
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const frame = getFaceFrame(miraScene, time);
  const isFinished = time >= miraScene.duration;
  const progress = time / miraScene.duration;

  useEffect(() => {
    if (!playing) return;

    let animationFrame = 0;
    const update = () => {
      if (audio.current) setTime(audio.current.currentTime);
      animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [playing]);

  function seek(seconds: number) {
    const player = audio.current;
    if (!player) return;
    player.currentTime = seconds;
    setTime(player.currentTime);
  }

  async function togglePlayback() {
    const player = audio.current;
    if (!player) return;
    if (!player.paused) {
      player.pause();
      return;
    }

    setError('');
    if (player.error) player.load();
    if (player.ended) seek(0);

    try {
      await player.play();
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return;
      setError('The scene audio couldn’t play. Try playing it again.');
    }
  }

  return (
    <section className="demo" aria-label="Compare the faces">
      <div className="stage-panel">
        <div className="stage" data-layer={layer}>
          <div className="stage-top" aria-hidden="true">
            <span>MIRA</span>
            {layer !== 'mouth' && <span className="expression">{frame.expression}</span>}
          </div>
          <div className="stage-target" aria-hidden="true" />
          {layer === 'keyboard' ? (
            <KeyboardFace frame={frame} />
          ) : (
            <Portrait frame={frame} expressive={layer === 'full'} />
          )}
        </div>
        <div className="caption-strip">
          <span className="caption-label">Caption</span>
          <p>{frame.caption || (time === 0 ? 'Play the scene to hear Mira.' : '\u00a0')}</p>
        </div>
        <div className="transport">
          <button className="play-button" type="button" onClick={togglePlayback}>
            <span className={playing ? 'pause-icon' : 'play-icon'} aria-hidden="true" />
            {playing ? 'Pause' : isFinished ? 'Replay' : 'Play'}
          </button>
          <div className="timeline">
            <div className="waveform" aria-hidden="true">
              {waveform.map((level, index) => (
                <span
                  key={index}
                  data-played={index < progress * waveform.length}
                  style={{ '--height': `${Math.max(8, level * 100)}%` } as CSSProperties}
                />
              ))}
            </div>
            <input
              aria-label="Scene position"
              aria-valuetext={`${time.toFixed(1)} of ${miraScene.duration} seconds`}
              className="scrubber"
              max={miraScene.duration}
              min={0}
              onChange={(event) => seek(event.currentTarget.valueAsNumber)}
              step={0.1}
              type="range"
              value={time}
            />
          </div>
          <span className="timecode" aria-hidden="true">
            {formatTime(time)} <span>/ 0:15</span>
          </span>
          <button
            className="mute-button"
            type="button"
            aria-label="Mute audio"
            aria-pressed={muted}
            onClick={() => setMuted(!muted)}
          >
            <span className="speaker-icon" aria-hidden="true" />
            <span className="speaker-wave" aria-hidden="true" />
          </button>
        </div>
        {error && (
          <p className="audio-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <aside className="comparison">
        <fieldset className="layer-picker">
          <legend>Choose a face</legend>
          {layers.map((option, index) => (
            <label className="layer-option" key={option.id}>
              <input
                name="face"
                type="radio"
                value={option.id}
                checked={layer === option.id}
                onChange={() => setLayer(option.id)}
              />
              <span className="layer-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="layer-copy">
                <span className="layer-name">{option.name}</span>
                <span className="layer-description">{option.description}</span>
              </span>
              <span className="radio-mark" aria-hidden="true" />
            </label>
          ))}
        </fieldset>
        <details className="transcript">
          <summary>Scene transcript</summary>
          <ol>
            {miraScene.captions.map((caption) => (
              <li key={caption.start}>
                <button type="button" onClick={() => seek(caption.start)}>
                  <span>{formatTime(caption.start)}</span>
                  {caption.text}
                </button>
              </li>
            ))}
          </ol>
        </details>
      </aside>

      <audio
        ref={audio}
        src="./mira.wav"
        preload="metadata"
        muted={muted}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={(event) => {
          setPlaying(false);
          setTime(event.currentTarget.currentTime);
        }}
        onSeeked={(event) => setTime(event.currentTarget.currentTime)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onError={() => setError('The scene audio couldn’t load. Try playing it again.')}
      />
    </section>
  );
}
