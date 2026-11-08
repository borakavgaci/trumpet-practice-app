import { PitchedNote } from "../../types/note";
import { PitchTuning } from "../../types/pitchTuning";
import formatPitchedNote from "../../utils/formatPitchedNote";
import TuningGauge from "./TuningGauge";
import "./NoteDisplay.css";

type NoteDisplayProps = {
  concertNote: PitchedNote | null;
  trumpetNote: PitchedNote | null;
  tuning: PitchTuning | null;
  isListening: boolean;
};

function visibleNote(note: PitchedNote | null) {
  return note ? `${note.noteName.replace("#", "♯")}${note.octave}` : "—";
}

export default function NoteDisplay({ concertNote, trumpetNote, tuning, isListening }: NoteDisplayProps) {
  const reading = isListening ? tuning : null;
  const displayedCents = reading ? Number(reading.cents.toFixed(1)) : 0;
  const direction = reading?.direction;
  const status = !isListening ? "Mikrofon kapalı" : !reading ? "Nota bekleniyor…" :
    direction === "flat" ? "Pes" : direction === "sharp" ? "Tiz" : "Akortta";
  const hint = !isListening ? "Mikrofonu aç, bir nota çal." : !reading ? "Seni dinliyor. Uzun bir nota çal." :
    direction === "flat" ? "Biraz daha tiz çal." : direction === "sharp" ? "Biraz daha pes çal." : "Tam yerindesin. Sesi koru.";

  return (
    <section className={`note-display ${reading ? `has-reading tuning-${direction}` : ""}`} aria-label="Canlı akort">
      <div className="tuner-heading">
        <span className={`tuner-status ${isListening ? "is-listening" : ""}`}><span className="status-dot" />{status}</span>
      </div>

      <div className="note-center">
        <span className="note-context">CONCERT NOTA</span>
        <h1 className="pitch-note" aria-label={`Concert nota: ${formatPitchedNote(reading ? concertNote : null)}`}>
          {reading && concertNote ? <>{concertNote.noteName.replace("#", "♯")}<span className="note-octave">{concertNote.octave}</span></> : <span className="empty-note">—</span>}
        </h1>
        <div className="transposed-note" aria-label={`Bb trompet notası: ${formatPitchedNote(reading ? trumpetNote : null)}`}>
          <span>B♭ trompet</span><span className="note-divider" /><strong>{visibleNote(reading ? trumpetNote : null)}</strong>
        </div>
      </div>

      <TuningGauge reading={reading} />

      <div className="reading-values">
        <span><span className="value-label">FREKANS</span><strong>{reading ? <>{reading.frequency.toFixed(1)} <span>Hz</span></> : "—"}</strong></span>
        <span className="values-divider" />
        <span><span className="value-label">SAPMA{reading ? ` · ${visibleNote(reading.note)}` : ""}</span><strong className={reading ? "cents-value" : ""}>{reading ? <>{displayedCents > 0 ? "+" : ""}{displayedCents.toFixed(1)} <span>cent</span></> : "—"}</strong></span>
      </div>
      <p className="tuner-hint">{hint}</p>
    </section>
  );
}
