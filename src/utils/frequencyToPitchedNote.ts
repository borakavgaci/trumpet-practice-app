import { PitchedNote } from "../types/note";
import { NoteName } from "../types/note";

export default function frequencyToPitchedNote(frequency: number | null) {

    if(frequency === null) {
        return null;
    }
    
    const midiNumber = 69 + 12 * Math.log(frequency / 440);
    const roundedMidiNumber = Math.round(midiNumber);
    const noteIndex = roundedMidiNumber % 12;
    const octave = Math.floor(roundedMidiNumber / 12) - 1;
    const notes: NoteName[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteName = notes[noteIndex];
    
    return {
        noteName,
        octave
    }
}