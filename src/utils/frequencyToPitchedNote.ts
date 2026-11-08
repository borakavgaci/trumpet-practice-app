import { PitchedNote, NoteName } from "../types/note";

export default function frequencyToPitchedNote(frequency: number | null): PitchedNote | null {

    if(frequency === null || frequency === 0 || frequency < 0 || !Number.isFinite(frequency)) {
        return null;
    }
    
    const midiNumber = 69 + 12 * (Math.log2(frequency) - Math.log2(440));
    const roundedMidiNumber = Math.round(midiNumber);
    const noteIndex = ((roundedMidiNumber % 12) + 12) % 12;
    const octave = Math.floor(roundedMidiNumber / 12) - 1;
    const notes: NoteName[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteName = notes[noteIndex];
    
    return {
        noteName,
        octave
    }
}
