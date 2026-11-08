
import { useState, useEffect, useRef } from "react";

import DeviceSelector from '../../components/DeviceSelector/DeviceSelector';
import NoteDisplay from '../../components/NoteDisplay/NoteDisplay';
import PianoKeyboard from '../../components/PianoKeyboard/PianoKeyboard';

import useAudioDevices from '../../hooks/useAudioDevices';
import useMicrophoneInput from '../../hooks/useMicrophoneInput';
import usePitchDetection from '../../hooks/usePitchDetection';
import useMidiInput from "../../hooks/useMidiInput";

import transposeNote from '../../utils/transposeNote';
import { PitchedNote } from '../../types/note';
import getPitchTuning from '../../utils/getPitchTuning';
import { pianoKeys } from "../../data/pianoKeys";
import { instruments, instrumentIds } from "../../data/instruments";


import useInstrumentAudio from "../../hooks/useInstrumentAudio";

type NoteSource = "mouse" | "midi";
const pianoMidiNumbers = new Set(pianoKeys.map(key => key.midiNumber));


export default function MainScreen() {

  const [activeKeys, setActiveKeys] = useState<number[]>([]);
  const activeNoteSourcesRef = useRef(new Map<number, Set<NoteSource>>());

  const {inputDevices, outputDevices, getAllDevices, selectedInputDeviceId, selectedOutputDeviceId, setSelectedInputDeviceId, setSelectedOutputDeviceId} = useAudioDevices();
  const {stream, isListening, startListening, stopListening} = useMicrophoneInput();
  const {pitch} = usePitchDetection(stream);
  const {initializeAudio, playNote, stopNote, stopAllNotes, isLoaded, isAudioStarted, isAudioStarting, instrument, selectInstrument, error: audioError} = useInstrumentAudio();
  const {initializeMidi, midiInputsArray, selectedMidiInputId, setSelectedMidiInputId, midiError, isMidiConnecting, isMidiReady} = useMidiInput({
    onNoteOn: (midiNumber, velocity) => activateNote(midiNumber, "midi", velocity),
    onNoteOff: midiNumber => deactivateNote(midiNumber, "midi"),
  });

  const tuning = getPitchTuning(isListening ? pitch : null);
  const concertNote = tuning?.note ?? null;
  let trumpetNote: PitchedNote | null = null;

  if(concertNote === null) {
    trumpetNote = concertNote;
  }
  else {
    trumpetNote = transposeNote(concertNote,2);
  }

  function activateNote(midiNumber: number, source: NoteSource, velocity = 1) {
    if (!pianoMidiNumbers.has(midiNumber)) return;

    const sources = activeNoteSourcesRef.current.get(midiNumber) ?? new Set<NoteSource>();
    if (sources.has(source)) return;

    const wasActive = sources.size > 0;
    sources.add(source);
    activeNoteSourcesRef.current.set(midiNumber, sources);
    if (!wasActive) playNote(midiNumber, velocity);
    setActiveKeys(Array.from(activeNoteSourcesRef.current.keys()));
  }

  function deactivateNote(midiNumber: number, source: NoteSource) {
    const sources = activeNoteSourcesRef.current.get(midiNumber);
    if (!sources || !sources.delete(source)) return;

    if (sources.size === 0) {
      activeNoteSourcesRef.current.delete(midiNumber);
      stopNote(midiNumber);
    }
    setActiveKeys(Array.from(activeNoteSourcesRef.current.keys()));
  }

  function activeKey(midiNumber: number) {
    activateNote(midiNumber, "mouse");
  }

  function deactiveKey(midiNumber: number) {
    deactivateNote(midiNumber, "mouse");
  }

  

useEffect(() => {
    function handleWindowBlur() {
    activeNoteSourcesRef.current.clear();
    setActiveKeys([]);
    stopAllNotes();
  }
  window.addEventListener("blur", handleWindowBlur);

  return () => {
    window.removeEventListener("blur", handleWindowBlur);
  };
}, [stopAllNotes]);


  return ( 
    <div>
      <button onClick={getAllDevices}>Load Devices</button>
      <button onClick={startListening}>Start Audio</button>
      <button onClick={stopListening}>Stop Audio</button>

      <DeviceSelector inputDevices = {inputDevices} outputDevices = {outputDevices} onInputDeviceChange = {setSelectedInputDeviceId} onOutputDeviceChange={setSelectedOutputDeviceId} selectedInputDeviceId={selectedInputDeviceId} selectedOutputDeviceId={selectedOutputDeviceId}/>
      <NoteDisplay concertNote={concertNote} trumpetNote={trumpetNote} tuning={tuning} isListening={isListening}/>

    <label>
      Enstrüman
      <select aria-label="Enstrüman" value={instrument} onChange={event => {
        const selected = event.currentTarget.value;
        if (selected === "piano" || selected === "trumpet") selectInstrument(selected);
      }}>
        {instrumentIds.map(id => <option key={id} value={id}>{instruments[id].label}</option>)}
      </select>
    </label>
    <button onClick={initializeAudio} disabled={!isLoaded || isAudioStarted || isAudioStarting}>
      {!isLoaded ? (audioError ? "Ses yüklenemedi" : "Ses yükleniyor…") : isAudioStarting ? "Ses başlatılıyor…" : isAudioStarted ? "Ses hazır" : "Sesi başlat"}
    </button>
    {audioError && <p role="alert">{instruments[instrument].label} sesi: {audioError}</p>}
    <button onClick={initializeMidi} disabled={isMidiConnecting}>
      {isMidiConnecting ? "MIDI bağlanıyor…" : "MIDI Bağla"}
    </button>
    {midiError && <p role="alert">MIDI: {midiError}</p>}
    <select aria-label="MIDI girişi" onChange={(event) => setSelectedMidiInputId(event.currentTarget.value)} value={selectedMidiInputId}>
      <option value="">{isMidiReady && midiInputsArray.length === 0 ? "MIDI girişi bulunamadı" : "MIDI Girişi Seç"}</option>
      {midiInputsArray.map((midiInput) => <option key={midiInput.id} value={midiInput.id}>{midiInput.name}</option>)}
      </select>
    <PianoKeyboard onActiveKey={activeKey} onDeactiveKey={deactiveKey} activeKeys={activeKeys}/>
    <details>
      <summary>Ses kaynakları</summary>
      <p>
        Piyano ve trompet kayıtları: Nicholaus P. Brosowsky / {" "}
        <a href="https://github.com/nbrosowsky/tonejs-instruments" target="_blank" rel="noreferrer">tonejs-instruments</a>. {" "}
        <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.
        Ses dosyaları değiştirilmedi; çalma sırasında perde ve ses seviyesi ayarlanır.
      </p>
    </details>

    </div>
  );
}
