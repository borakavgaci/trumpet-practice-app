
import { PitchedNote } from "../types/note";

export default function formatPitchedNote(note: PitchedNote | null): string {
    
    if(note === null) {
        return "--"
    }
    else {
        return note.noteName + note.octave
        
    }
}