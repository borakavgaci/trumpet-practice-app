import { PitchTuning } from "../types/pitchTuning";
import getPitchTuning, { GAUGE_RANGE_CENTS } from "./getPitchTuning";

export const PITCH_TRACKING = {
    smoothingMs: 100,
    medianSamples: 5,
    jumpThresholdCents: 350,
    jumpConfirmationMs: 100,
    jumpAgreementCents: 80,
    noteBoundaryCents: 65,
    noteConfirmationMs: 80,
    silenceResetMs: 250,
    gaugeRangeCents: GAUGE_RANGE_CENTS + 10,
} as const;

/** Track one microphone session; all times are milliseconds from performance.now(). */
export default function createPitchTracker() {
    let samples: number[] = [];
    let filteredMidi: number | null = null;
    let noteMidi: number | null = null;
    let gaugeMidi: number | null = null;
    let candidateMidi: number | null = null;
    let candidateSince = 0;
    let lastValidTime: number | null = null;
    let lastReading: PitchTuning | null = null;
    let pendingJump: { midi: number; since: number } | null = null;

    function reset() {
        samples = [];
        filteredMidi = null;
        noteMidi = null;
        gaugeMidi = null;
        candidateMidi = null;
        candidateSince = 0;
        lastValidTime = null;
        lastReading = null;
        pendingJump = null;
    }

    function update(frequency: number | null, timestamp: number): PitchTuning | null {
        if (!Number.isFinite(timestamp)) {
            reset();
            return null;
        }
        if (lastValidTime !== null && (timestamp < lastValidTime || timestamp - lastValidTime >= PITCH_TRACKING.silenceResetMs)) reset();

        if (frequency === null || !Number.isFinite(frequency) || frequency <= 0) {
            // A brief clarity/volume dropout should not make the note flicker.
            candidateMidi = null;
            pendingJump = null;
            return lastReading;
        }

        const midi = 69 + 12 * (Math.log2(frequency) - Math.log2(440));
        if (filteredMidi !== null && Math.abs(midi - filteredMidi) * 100 > PITCH_TRACKING.jumpThresholdCents) {
            if (pendingJump === null || Math.abs(midi - pendingJump.midi) * 100 > PITCH_TRACKING.jumpAgreementCents) {
                pendingJump = { midi, since: timestamp };
            }
            if (timestamp - pendingJump.since < PITCH_TRACKING.jumpConfirmationMs) {
                lastValidTime = timestamp;
                return lastReading;
            }
            // Accept a sustained leap, without leaving old samples in its median window.
            samples = [];
        } else {
            pendingJump = null;
        }
        samples.push(midi);
        if (samples.length > PITCH_TRACKING.medianSamples) samples.shift();
        const sorted = [...samples].sort((a, b) => a - b);
        // Five samples reject short bursts of bad pitch estimates.
        const median = sorted.length === 2 ? (sorted[0] + sorted[1]) / 2 : sorted[Math.floor(sorted.length / 2)];
        const elapsed = lastValidTime === null ? 0 : timestamp - lastValidTime;
        const alpha = 1 - Math.exp(-elapsed / PITCH_TRACKING.smoothingMs);
        filteredMidi = filteredMidi === null ? median : filteredMidi + alpha * (median - filteredMidi);

        if (noteMidi === null) noteMidi = Math.round(filteredMidi);
        const nearestMidi = Math.round(filteredMidi);
        if (Math.abs(filteredMidi - noteMidi) * 100 > PITCH_TRACKING.noteBoundaryCents && nearestMidi !== noteMidi) {
            if (candidateMidi !== nearestMidi) {
                candidateMidi = nearestMidi;
                candidateSince = timestamp;
            } else if (timestamp - candidateSince >= PITCH_TRACKING.noteConfirmationMs) {
                noteMidi = candidateMidi;
                candidateMidi = null;
            }
        } else {
            candidateMidi = null;
        }

        // Keep the five-note scale through a whole-tone slide, independently of
        // the detected note name. The extra margin prevents edge recenter jitter.
        if (gaugeMidi === null || Math.abs(filteredMidi - gaugeMidi) * 100 > PITCH_TRACKING.gaugeRangeCents) {
            gaugeMidi = Math.round(filteredMidi);
        }

        const smoothedFrequency = 440 * 2 ** ((filteredMidi - 69) / 12);
        lastReading = getPitchTuning(smoothedFrequency, { noteMidi, gaugeMidi });
        if (lastReading === null) {
            reset();
            return null;
        }
        lastValidTime = timestamp;
        return lastReading;
    }

    return { update, reset };
}
