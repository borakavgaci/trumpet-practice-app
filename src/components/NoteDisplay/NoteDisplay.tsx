import { PitchedNote } from "../../types/note";

type NoteDisplayProps = {
        concertNote: PitchedNote | null;
        trumpetNote: PitchedNote | null;
        frequency: number;
        isListening: boolean;
}

export default function NoteDisplay({concertNote, trumpetNote, frequency, isListening}: NoteDisplayProps) {
    
  
    return (
        <div>
            <h1>Note Display</h1>
            <h2>Concert Note: {concertNote?.noteName}{concertNote?.octave}</h2>
            <h2>Trumpet Note: {trumpetNote?.noteName}{trumpetNote?.octave}</h2>

            

        </div>
    );
}