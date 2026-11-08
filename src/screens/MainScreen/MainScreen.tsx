import { useState, useEffect, useRef } from "react";
import DeviceSelector from "../../components/DeviceSelector/DeviceSelector";
import NoteDisplay from "../../components/NoteDisplay/NoteDisplay";
import PianoKeyboard from "../../components/PianoKeyboard/PianoKeyboard";
import Icon from "../../components/Icon";
import useAudioDevices from "../../hooks/useAudioDevices";
import useMicrophoneInput from "../../hooks/useMicrophoneInput";
import usePitchDetection from "../../hooks/usePitchDetection";
import useMidiInput from "../../hooks/useMidiInput";
import useInstrumentAudio from "../../hooks/useInstrumentAudio";
import transposeNote from "../../utils/transposeNote";
import { pianoKeys } from "../../data/pianoKeys";
import { instruments, instrumentIds } from "../../data/instruments";

type NoteSource = "mouse" | "midi";
const pianoMidiNumbers = new Set(pianoKeys.map(key => key.midiNumber));

export default function MainScreen() {
  const [activeKeys, setActiveKeys] = useState<number[]>([]);
  const [isMicStarting, setIsMicStarting] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const activeNoteSourcesRef = useRef(new Map<number, Set<NoteSource>>());
  const micStartingRef = useRef(false);
  const { inputDevices, outputDevices, getAllDevices, selectedInputDeviceId, setSelectedInputDeviceId } = useAudioDevices();
  const { stream, isListening, error: microphoneError, startListening, stopListening } = useMicrophoneInput(selectedInputDeviceId);
  const { tuning: detectedTuning, volume } = usePitchDetection(stream);
  const { initializeAudio, playNote, stopNote, stopAllNotes, isLoaded, isAudioStarted, isAudioStarting, instrument, selectInstrument, error: audioError, outputDeviceId, selectOutput, outputError, canSelectOutput, isOutputChanging } = useInstrumentAudio();
  const { initializeMidi, midiInputsArray, selectedMidiInputId, setSelectedMidiInputId, midiError, isMidiConnecting, isMidiReady } = useMidiInput({
    onNoteOn: (midiNumber, velocity) => activateNote(midiNumber, "midi", velocity),
    onNoteOff: midiNumber => deactivateNote(midiNumber, "midi"),
  });

  const tuning = isListening ? detectedTuning : null;
  const concertNote = tuning?.note ?? null;
  const trumpetNote = concertNote ? transposeNote(concertNote, 2) : null;
  const selectedMidiInput = midiInputsArray.find(input => input.id === selectedMidiInputId);
  const inputLevel = isListening && Number.isFinite(volume) ? Math.min(1, volume * 5) : 0;
  const audioButtonLabel = !isLoaded ? (audioError ? "Ses yüklenemedi" : "Ses yükleniyor…") :
    isAudioStarting ? "Ses başlatılıyor…" : isAudioStarted ? "Ses hazır" : "Sesi başlat";

  useEffect(() => {
    let disposed = false;
    getAllDevices().catch(() => {
      if (!disposed) setDeviceError("Mikrofon listesi alınamadı. Yenilemeyi deneyebilirsin.");
    });
    return () => { disposed = true; };
  }, [getAllDevices]);

  async function refreshDevices() {
    setDeviceError(null);
    try {
      await getAllDevices();
    } catch {
      setDeviceError("Mikrofon listesi alınamadı. Yenilemeyi deneyebilirsin.");
    }
  }

  async function beginListening() {
    if (micStartingRef.current) return;
    micStartingRef.current = true;
    setIsMicStarting(true);
    try {
      await startListening();
      await refreshDevices();
    } finally {
      micStartingRef.current = false;
      setIsMicStarting(false);
    }
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

  function activeKey(midiNumber: number) { activateNote(midiNumber, "mouse"); }
  function deactiveKey(midiNumber: number) { deactivateNote(midiNumber, "mouse"); }

  useEffect(() => {
    function handleWindowBlur() {
      activeNoteSourcesRef.current.clear();
      setActiveKeys([]);
      stopAllNotes();
    }
    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [stopAllNotes]);

  return (
    <div className="workspace">
      <section className="settings-panel" aria-label="Ayarlar">
        <div className="setting-group microphone-setting">
          <div className="setting-heading">
            <span className="setting-title"><Icon name="microphone" />Input</span>
            <button type="button" className="icon-button" aria-label="Mikrofonları yenile" title="Mikrofonları yenile" onClick={refreshDevices} disabled={isMicStarting}><Icon name="refresh" /></button>
          </div>
          <div className="setting-controls">
            <DeviceSelector inputDevices={inputDevices} selectedInputDeviceId={selectedInputDeviceId} onInputDeviceChange={setSelectedInputDeviceId} disabled={isListening || isMicStarting} />
            <button type="button" className={`button ${isListening ? "button-listening" : "button-primary"}`} onClick={isListening ? stopListening : beginListening} disabled={isMicStarting}>
              <Icon name={isListening ? "stop" : "microphone"} />
              {isMicStarting ? "Açılıyor…" : isListening ? "Durdur" : "Dinle"}
            </button>
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-heading"><span className="setting-title"><Icon name="sound" />Output</span><span className="small-label">SES ÇIKIŞI</span></div>
          <div className="setting-controls">
            <label className="select-field">
              <span className="sr-only">Ses çıkışı</span>
              <select aria-label="Ses çıkışı" value={outputDeviceId} onChange={event => selectOutput(event.currentTarget.value)} disabled={!canSelectOutput || isOutputChanging}>
                <option value="">Sistem varsayılanı</option>
                {outputDevices.filter(device => device.id && device.id !== "default").map((device, index) => <option key={device.id} value={device.id}>{device.label || `Ses çıkışı ${index + 1}`}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="setting-group">
          <div className="setting-heading"><span className="setting-title"><Icon name="midi" />MIDI</span><span className={`connection-indicator ${selectedMidiInput ? "is-connected" : ""}`}><span className="status-dot" />{selectedMidiInput ? "Bağlı" : "Bağlı değil"}</span></div>
          <div className="setting-controls">
            <label className="select-field">
              <span className="sr-only">MIDI girişi</span>
              <select aria-label="MIDI girişi" onChange={event => setSelectedMidiInputId(event.currentTarget.value)} value={selectedMidiInputId}>
                <option value="">{isMidiReady && midiInputsArray.length === 0 ? "MIDI girişi bulunamadı" : "Cihaz seç"}</option>
                {midiInputsArray.map(input => <option key={input.id} value={input.id}>{input.name || "MIDI klavye"}</option>)}
              </select>
            </label>
            <button type="button" className="button button-secondary" onClick={initializeMidi} disabled={isMidiConnecting}>{isMidiConnecting ? "Bağlanıyor…" : "MIDI Bağla"}</button>
          </div>
        </div>
      </section>

      {(microphoneError || audioError || midiError || deviceError || outputError) && (
        <div className="error-stack">
          {microphoneError && <p role="alert">Mikrofon açılamadı: {microphoneError}</p>}
          {audioError && <p role="alert">{instruments[instrument].label} sesi: {audioError}</p>}
          {midiError && <p role="alert">MIDI: {midiError}</p>}
          {deviceError && <p role="alert">{deviceError}</p>}
          {outputError && <p role="alert">Ses çıkışı değiştirilemedi: {outputError}</p>}
        </div>
      )}

      <main id="main" className="tuner-section">
        <NoteDisplay concertNote={concertNote} trumpetNote={trumpetNote} tuning={tuning} isListening={isListening} />
      </main>

      <section className="keyboard-section" aria-labelledby="keyboard-title">
        <div className="section-heading">
          <h2 id="keyboard-title">Klavye</h2>
          <div className="keyboard-meta">
            <span className="range-tag">F♯3 — B5</span>
            <label className="select-field instrument-field">
              <span className="sr-only">Enstrüman</span>
              <select aria-label="Enstrüman" value={instrument} onChange={event => {
                const selected = event.currentTarget.value;
                if (selected === "piano" || selected === "trumpet") selectInstrument(selected);
              }}>
                {instrumentIds.map(id => <option key={id} value={id}>{instruments[id].label}</option>)}
              </select>
            </label>
            <button type="button" className={`button ${isAudioStarted ? "button-ready" : "button-secondary"}`} onClick={initializeAudio} disabled={!isLoaded || isAudioStarted || isAudioStarting}>
              <Icon name="sound" />{audioButtonLabel}
            </button>
          </div>
        </div>
        <PianoKeyboard onActiveKey={activeKey} onDeactiveKey={deactiveKey} activeKeys={activeKeys} />
      </section>

      <footer className="app-footer">
        <div className="footer-tools">
          <span className="input-level" title="Mikrofon ses seviyesi" aria-label={isListening ? "Mikrofon açık" : "Mikrofon kapalı"}><Icon name="microphone" /><span className="level-track"><span style={{ width: `${inputLevel * 100}%` }} /></span></span>
        </div>
      </footer>
    </div>
  );
}
