import { PitchedNote } from "../../types/note";

import formatPitchedNote from "../../utils/formatPitchedNote";

type NoteDisplayProps = {
        concertNote: PitchedNote | null;
        trumpetNote: PitchedNote | null;
        frequency: number | null;
        isListening: boolean;
}

export default function NoteDisplay({concertNote, trumpetNote, frequency, isListening}: NoteDisplayProps) {
    
  
    return (
        <div>
            <h1>Note Display</h1>
            <h2>Concert Note: {formatPitchedNote(concertNote)} </h2>
            <h2>Trumpet Note: {formatPitchedNote(trumpetNote)}</h2>

            

        </div>
    );
}