import { PitchTuning } from "../types/pitchTuning";
import frequencyToPitchedNote from "./frequencyToPitchedNote";
import transposeNote from "./transposeNote";

export const IN_TUNE_TOLERANCE_CENTS = 10;
export const GAUGE_RANGE_CENTS = 200;
const CENTS_EPSILON = 1e-9;

type TuningReferences = {
    noteMidi?: number;
    gaugeMidi?: number;
};

export default function getPitchTuning(frequency: number | null, references: TuningReferences = {}): PitchTuning | null {
    if (frequency === null || !Number.isFinite(frequency) || frequency <= 0) return null;

    const nearestMidi = Math.round(69 + 12 * (Math.log2(frequency) - Math.log2(440)));
    const noteMidi = references.noteMidi ?? nearestMidi;
    const gaugeMidi = references.gaugeMidi ?? noteMidi;
    if (!Number.isInteger(noteMidi) || !Number.isInteger(gaugeMidi)) return null;
    const referenceFrequency = 440 * 2 ** ((noteMidi - 69) / 12);
    if (!Number.isFinite(referenceFrequency) || referenceFrequency <= 0) return null;
    const gaugeReferenceFrequency = 440 * 2 ** ((gaugeMidi - 69) / 12);
    if (!Number.isFinite(gaugeReferenceFrequency) || gaugeReferenceFrequency <= 0) return null;
    const note = frequencyToPitchedNote(referenceFrequency);
    const gaugeNote = frequencyToPitchedNote(gaugeReferenceFrequency);
    if (note === null || gaugeNote === null) return null;

    const rawCents = 1200 * Math.log2(frequency / referenceFrequency);
    // Remove floating-point residue at exact notes without rounding real deviations.
    const cents = Math.abs(rawCents) < CENTS_EPSILON ? 0 : rawCents;
    const rawGaugeCents = 1200 * Math.log2(frequency / gaugeReferenceFrequency);
    const gaugeCents = Math.abs(rawGaugeCents) < CENTS_EPSILON ? 0 : rawGaugeCents;
    if (!Number.isFinite(cents) || !Number.isFinite(gaugeCents)) return null;
    const isInTune = Math.abs(cents) <= IN_TUNE_TOLERANCE_CENTS + CENTS_EPSILON;

    return {
        frequency,
        note,
        referenceFrequency,
        cents,
        direction: isInTune ? "in-tune" : cents < 0 ? "flat" : "sharp",
        gaugeNote,
        gaugeCents,
        lowerNote: transposeNote(gaugeNote, -GAUGE_RANGE_CENTS / 100),
        upperNote: transposeNote(gaugeNote, GAUGE_RANGE_CENTS / 100),
        barPosition: Math.max(0, Math.min(1, 0.5 + gaugeCents / (2 * GAUGE_RANGE_CENTS))),
    };
}
