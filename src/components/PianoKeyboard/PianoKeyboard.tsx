import { CSSProperties, useEffect, useRef } from "react";
import "./PianoKeyboard.css";
import { PianoKeyProps, pianoKeys } from "../../data/pianoKeys";

// A partial, decorative F3 key gives the first black key (F#3) its real position.
const leadingSpace = pianoKeys[0].isBlack ? 0.5 : 0;
const whiteKeyCount = pianoKeys.filter(key => !key.isBlack).length + leadingSpace;
let whitePosition = leadingSpace;
const positionedKeys = pianoKeys.map(key => {
  const position = key.isBlack ? whitePosition - 0.31 : whitePosition++;
  return { ...key, position };
});

export default function PianoKeyboard({ onActiveKey, onDeactiveKey, activeKeys }: PianoKeyProps) {
  const heldPointers = useRef(new Map<number, number>());
  const heldKeyboardKeys = useRef(new Set<number>());

  useEffect(() => {
    function clearHeldInputs() {
      heldPointers.current.clear();
      heldKeyboardKeys.current.clear();
    }
    window.addEventListener("blur", clearHeldInputs);
    return () => window.removeEventListener("blur", clearHeldInputs);
  }, []);

  function releasePointer(pointerId: number) {
    const midi = heldPointers.current.get(pointerId);
    if (midi === undefined) return;
    heldPointers.current.delete(pointerId);
    if (![...heldPointers.current.values()].includes(midi) && !heldKeyboardKeys.current.has(midi)) onDeactiveKey(midi);
  }

  return (
    <div className="piano-shell">
      <div className="piano-rail" aria-hidden="true"><span /><span>F♯3 — B5</span></div>
      <div className="keyboard-viewport" role="group" aria-label="Piyano klavyesi, F#3 ile B5 arası">
        <div className="piano-keybed" style={{ "--white-key-count": whiteKeyCount } as CSSProperties}>
          {leadingSpace > 0 && <span className="piano-leading-key" aria-hidden="true" />}
          {positionedKeys.map(key => {
            const isActive = activeKeys.includes(key.midiNumber);
            return (
              <button
                type="button"
                key={key.midiNumber}
                aria-label={`${key.noteName}${key.octave}`}
                aria-pressed={isActive}
                className={`piano-key ${key.isBlack ? "black-key" : "white-key"} ${isActive ? "active" : ""}`}
                style={{ left: `${key.position / whiteKeyCount * 100}%` }}
                onPointerDown={event => {
                  if (event.button !== 0) return;
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  heldPointers.current.set(event.pointerId, key.midiNumber);
                  onActiveKey(key.midiNumber);
                }}
                onPointerUp={event => releasePointer(event.pointerId)}
                onPointerCancel={event => releasePointer(event.pointerId)}
                onLostPointerCapture={event => releasePointer(event.pointerId)}
                onKeyDown={event => {
                  if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                    event.preventDefault();
                    heldKeyboardKeys.current.add(key.midiNumber);
                    onActiveKey(key.midiNumber);
                  }
                }}
                onKeyUp={event => {
                  if (event.key === " " || event.key === "Enter") {
                    event.preventDefault();
                    heldKeyboardKeys.current.delete(key.midiNumber);
                    if (![...heldPointers.current.values()].includes(key.midiNumber)) onDeactiveKey(key.midiNumber);
                  }
                }}
                onBlur={() => {
                  if (heldKeyboardKeys.current.delete(key.midiNumber) && ![...heldPointers.current.values()].includes(key.midiNumber)) onDeactiveKey(key.midiNumber);
                }}
              >
                <span className="key-label">{key.noteName.replace("#", "♯")}<span>{key.octave}</span></span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
