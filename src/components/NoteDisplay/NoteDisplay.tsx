import { PitchedNote } from "../../types/note";
import { PitchTuning } from "../../types/pitchTuning";

import formatPitchedNote from "../../utils/formatPitchedNote";

type NoteDisplayProps = {
        concertNote: PitchedNote | null;
        trumpetNote: PitchedNote | null;
        tuning: PitchTuning | null;
        isListening: boolean;
}

export default function NoteDisplay({concertNote, trumpetNote, tuning, isListening}: NoteDisplayProps) {
    const displayedCents = tuning === null ? 0 : Number(tuning.cents.toFixed(1));
  
    return (
        <div>
            <h1>Note Display</h1>
            <h2>Concert Note: {formatPitchedNote(concertNote)} </h2>
            <h2>Trumpet Note: {formatPitchedNote(trumpetNote)}</h2>
            {isListening && tuning ? (
                <p>
                    {tuning.frequency.toFixed(1)} Hz · Sapma: {displayedCents > 0 ? "+" : ""}{displayedCents.toFixed(1)} cent
                    {" · "}{tuning.direction === "flat" ? "Pes" : tuning.direction === "sharp" ? "Tiz" : "Akortta"}
                </p>
            ) : (
                <p>{isListening ? "Nota bekleniyor…" : "Mikrofon kapalı"}</p>
            )}

        </div>
    );
}
