import { PitchTuning } from "../types/pitchTuning";
import frequencyToPitchedNote from "./frequencyToPitchedNote";
import transposeNote from "./transposeNote";

export const IN_TUNE_TOLERANCE_CENTS = 5;
const CENTS_EPSILON = 1e-9;

export default function getPitchTuning(frequency: number | null): PitchTuning | null {
    const note = frequencyToPitchedNote(frequency);
    if (note === null || frequency === null) return null;

    const nearestMidiNumber = Math.round(69 + 12 * (Math.log2(frequency) - Math.log2(440)));
    const referenceFrequency = 440 * 2 ** ((nearestMidiNumber - 69) / 12);
    if (!Number.isFinite(referenceFrequency) || referenceFrequency <= 0) return null;

    const rawCents = 1200 * Math.log2(frequency / referenceFrequency);
    // Remove floating-point residue at exact notes without rounding real deviations.
    const cents = Math.abs(rawCents) < CENTS_EPSILON ? 0 : rawCents;
    const isInTune = Math.abs(cents) <= IN_TUNE_TOLERANCE_CENTS + CENTS_EPSILON;

    return {
        frequency,
        note,
        referenceFrequency,
        cents,
        direction: isInTune ? "in-tune" : cents < 0 ? "flat" : "sharp",
        lowerNote: transposeNote(note, -1),
        upperNote: transposeNote(note, 1),
        barPosition: Math.max(0, Math.min(1, (cents + 100) / 200)),
    };
}
