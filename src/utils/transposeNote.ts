import { NoteName, PitchedNote } from "../types/note";

export default function transposeNote(note: PitchedNote, semitones: number): PitchedNote {

    const notes: NoteName[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    

    const currentIndex = notes.indexOf(note.noteName);

    const rawIndex = currentIndex + semitones;

    const newIndex = ((rawIndex % 12) + 12) % 12;
    const octaveShift = Math.floor(rawIndex / 12);

    
    const newOctave = note.octave + octaveShift;
    const newNote = notes[newIndex];
    
    return {
        noteName: newNote,
        octave: newOctave
    };

    }
    

   
