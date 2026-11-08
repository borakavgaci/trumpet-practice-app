import pianoC4 from "../assets/samples/piano/samples_piano_C4.mp3";
import trumpetF3 from "../assets/samples/trumpet/F3.mp3";
import trumpetA3 from "../assets/samples/trumpet/A3.mp3";
import trumpetC4 from "../assets/samples/trumpet/C4.mp3";
import trumpetDs4 from "../assets/samples/trumpet/Ds4.mp3";
import trumpetF4 from "../assets/samples/trumpet/F4.mp3";
import trumpetG4 from "../assets/samples/trumpet/G4.mp3";
import trumpetAs4 from "../assets/samples/trumpet/As4.mp3";
import trumpetD5 from "../assets/samples/trumpet/D5.mp3";
import trumpetF5 from "../assets/samples/trumpet/F5.mp3";
import trumpetA5 from "../assets/samples/trumpet/A5.mp3";
import trumpetC6 from "../assets/samples/trumpet/C6.mp3";

export const instrumentIds = ["piano", "trumpet"] as const;
export type InstrumentId = typeof instrumentIds[number];

type InstrumentDefinition = {
  label: string;
  urls: Record<string, string>;
  release: number;
  volume: number;
};

export const instruments: Record<InstrumentId, InstrumentDefinition> = {
  piano: {
    label: "Piyano",
    urls: { C4: pianoC4 },
    release: 0.1,
    volume: 0,
  },
  trumpet: {
    label: "Trompet",
    urls: {
      F3: trumpetF3,
      A3: trumpetA3,
      C4: trumpetC4,
      "D#4": trumpetDs4,
      F4: trumpetF4,
      G4: trumpetG4,
      "A#4": trumpetAs4,
      D5: trumpetD5,
      F5: trumpetF5,
      A5: trumpetA5,
      C6: trumpetC6,
    },
    release: 0.08,
    volume: -2,
  },
};
