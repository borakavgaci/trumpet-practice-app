import { PitchedNote } from "./note";

export type PitchTuning = {
    frequency: number;
    note: PitchedNote;
    referenceFrequency: number;
    /** Negative means flat, positive means sharp. One semitone is 100 cents. */
    cents: number;
    direction: "flat" | "in-tune" | "sharp";
    /** The bar holds its own reference through continuous slides within its range. */
    gaugeNote: PitchedNote;
    gaugeCents: number;
    lowerNote: PitchedNote;
    upperNote: PitchedNote;
    /** 0 = lower note (-200 cents), 0.5 = center, 1 = upper note (+200 cents). */
    barPosition: number;
};
