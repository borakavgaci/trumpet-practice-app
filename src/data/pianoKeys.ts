import { NoteName } from "../types/note";

export type PianoKey = {
    midiNumber: number;
    noteName: NoteName;
    octave: number;
    isBlack: boolean;
}

export type PianoKeyProps = {
    onActiveKey: (midiNumber:number) => void;
    onDeactiveKey: (midiNumber:number) => void;
    activeKeys: number[];
}

export const pianoKeys: PianoKey[] = [
  { midiNumber: 54, noteName: "F#", octave: 3, isBlack: true },
  { midiNumber: 55, noteName: "G", octave: 3, isBlack: false },
  { midiNumber: 56, noteName: "G#", octave: 3, isBlack: true },
  { midiNumber: 57, noteName: "A", octave: 3, isBlack: false },
  { midiNumber: 58, noteName: "A#", octave: 3, isBlack: true },
  { midiNumber: 59, noteName: "B", octave: 3, isBlack: false },

  { midiNumber: 60, noteName: "C", octave: 4, isBlack: false },
  { midiNumber: 61, noteName: "C#", octave: 4, isBlack: true },
  { midiNumber: 62, noteName: "D", octave: 4, isBlack: false },
  { midiNumber: 63, noteName: "D#", octave: 4, isBlack: true },
  { midiNumber: 64, noteName: "E", octave: 4, isBlack: false },
  { midiNumber: 65, noteName: "F", octave: 4, isBlack: false },
  { midiNumber: 66, noteName: "F#", octave: 4, isBlack: true },
  { midiNumber: 67, noteName: "G", octave: 4, isBlack: false },
  { midiNumber: 68, noteName: "G#", octave: 4, isBlack: true },
  { midiNumber: 69, noteName: "A", octave: 4, isBlack: false },
  { midiNumber: 70, noteName: "A#", octave: 4, isBlack: true },
  { midiNumber: 71, noteName: "B", octave: 4, isBlack: false },

  { midiNumber: 72, noteName: "C", octave: 5, isBlack: false },
  { midiNumber: 73, noteName: "C#", octave: 5, isBlack: true },
  { midiNumber: 74, noteName: "D", octave: 5, isBlack: false },
  { midiNumber: 75, noteName: "D#", octave: 5, isBlack: true },
  { midiNumber: 76, noteName: "E", octave: 5, isBlack: false },
  { midiNumber: 77, noteName: "F", octave: 5, isBlack: false },
  { midiNumber: 78, noteName: "F#", octave: 5, isBlack: true },
  { midiNumber: 79, noteName: "G", octave: 5, isBlack: false },
  { midiNumber: 80, noteName: "G#", octave: 5, isBlack: true },
  { midiNumber: 81, noteName: "A", octave: 5, isBlack: false },
  { midiNumber: 82, noteName: "A#", octave: 5, isBlack: true },
  { midiNumber: 83, noteName: "B", octave: 5, isBlack: false },
];