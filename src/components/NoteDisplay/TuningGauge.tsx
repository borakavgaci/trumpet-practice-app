import { PitchTuning } from "../../types/pitchTuning";
import { GAUGE_RANGE_CENTS, IN_TUNE_TOLERANCE_CENTS } from "../../utils/getPitchTuning";
import frequencyToPitchedNote from "../../utils/frequencyToPitchedNote";
import formatPitchedNote from "../../utils/formatPitchedNote";
import useGaugeMotion from "../../hooks/useGaugeMotion";

export default function TuningGauge({ reading }: { reading: PitchTuning | null }) {
    const target = reading ? {
        centerMidi: Math.round(69 + 12 * (Math.log2(reading.frequency) - Math.log2(440)) - reading.gaugeCents / 100),
        offsetCents: reading.gaugeCents,
    } : null;
    const frame = useGaugeMotion(target);
    const centerMidi = frame?.centerMidi ?? 69;
    const range = GAUGE_RANGE_CENTS / 100;
    const referenceMidi = Math.round(target?.centerMidi ?? centerMidi);
    const positionFor = (midi: number) => (0.5 + (midi - centerMidi) / (2 * range)) * 100;
    const firstNote = Math.ceil(centerMidi - range - 1e-8);
    const lastNote = Math.floor(centerMidi + range + 1e-8);
    const notes = Array.from({ length: lastNote - firstNote + 1 }, (_, index) => {
        const midi = firstNote + index;
        return { midi, position: positionFor(midi), note: frequencyToPitchedNote(440 * 2 ** ((midi - 69) / 12)) };
    });
    const firstTick = Math.ceil((centerMidi - range) * 10 - 1e-8);
    const lastTick = Math.floor((centerMidi + range) * 10 + 1e-8);
    const ticks = Array.from({ length: lastTick - firstTick + 1 }, (_, index) => firstTick + index);
    const animatedPitch = centerMidi + (frame?.offsetCents ?? 0) / 100;
    const isDetuned = Math.abs(animatedPitch - Math.round(animatedPitch)) * 100 > IN_TUNE_TOLERANCE_CENTS + 1e-9;
    const toleranceWidth = IN_TUNE_TOLERANCE_CENTS / GAUGE_RANGE_CENTS * 100;
    const scale = [-GAUGE_RANGE_CENTS, -100, 0, 100, GAUGE_RANGE_CENTS];

    return (
        <div className="tuning-gauge">
            <div className="gauge-note-labels" aria-hidden="true">
                {reading ? notes.map(({ midi, position, note }) => (
                    <span key={midi} className={`gauge-note-label ${midi === referenceMidi ? "is-reference" : Math.abs(midi - referenceMidi) >= 2 ? "is-distant" : ""}`}
                        style={{ left: `${position}%` }}>{formatPitchedNote(note).replace("#", "♯")}</span>
                )) : scale.map(cents => <span key={cents} className={`gauge-note-label ${cents === 0 ? "is-reference" : ""}`}
                    style={{ left: `${(0.5 + cents / (2 * GAUGE_RANGE_CENTS)) * 100}%` }}>—</span>)}
            </div>
            <div className="gauge-track" role={reading ? "meter" : undefined} aria-label="Akort sapması"
                aria-valuemin={reading ? -GAUGE_RANGE_CENTS : undefined} aria-valuemax={reading ? GAUGE_RANGE_CENTS : undefined}
                aria-valuenow={reading ? Math.max(-GAUGE_RANGE_CENTS, Math.min(GAUGE_RANGE_CENTS, reading.gaugeCents)) : undefined}
                aria-valuetext={reading ? `${formatPitchedNote(reading.gaugeNote)} merkezine göre ${Number(reading.gaugeCents.toFixed(1)).toFixed(1)} cent` : undefined}>
                <div className="gauge-axis" aria-hidden="true">
                    <span className="gauge-center-line" />
                    <span className="gauge-in-tune-zone" style={{ width: `${toleranceWidth}%`, left: `${positionFor(referenceMidi) - toleranceWidth / 2}%` }} />
                    {ticks.map(tick => <span key={tick} className={`gauge-tick ${tick % 10 === 0 ? "major-tick" : tick % 5 === 0 ? "half-tick" : ""}`} style={{ left: `${positionFor(tick / 10)}%` }} />)}
                </div>
                {reading && frame && <span className={`gauge-needle ${isDetuned ? "is-detuned" : ""}`} style={{ left: `${frame.position * 100}%` }} aria-hidden="true"><span /></span>}
            </div>
            <div className="gauge-scale" aria-hidden="true">{scale.map(cents => <span key={cents}
                style={{ left: `${(0.5 + cents / (2 * GAUGE_RANGE_CENTS)) * 100}%` }}>{cents > 0 ? "+" : cents < 0 ? "−" : ""}{Math.abs(cents)}</span>)}</div>
        </div>
    );
}
