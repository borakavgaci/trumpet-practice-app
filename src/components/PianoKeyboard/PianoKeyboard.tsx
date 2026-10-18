import './PianoKeyboard.css';
import { PianoKeyProps, pianoKeys } from '../../data/pianoKeys';


export default function PianoKeyboard({onActiveKey, onDeactiveKey, activeKeys}: PianoKeyProps) {

  

  const listKeys = pianoKeys.map(pianoKey => {
    

  const isActive = activeKeys.includes(pianoKey.midiNumber);

  return (
    <button key={pianoKey.midiNumber} 
    onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId); 
        onActiveKey(pianoKey.midiNumber);
    }}
    onPointerUp={() => onDeactiveKey(pianoKey.midiNumber)} className={isActive ? "piano-key active" : "piano-key"}
    onPointerCancel={() => onDeactiveKey(pianoKey.midiNumber)}>
        {pianoKey.noteName}{pianoKey.octave}
    
    </button>
    );
});

    return (
        <div>
            {listKeys}
        </div>
    );
}