import { GAUGE_RANGE_CENTS } from "./getPitchTuning";

export type GaugeTarget = {
    centerMidi: number;
    offsetCents: number;
};

export type GaugeFrame = GaugeTarget & {
    position: number;
};

export const GAUGE_MOTION = {
    smoothingMs: 120,
    maxSemitonesPerSecond: 4.8,
    maxSemitonesAcceleration: 32,
    calmSemitonesAcceleration: 16,
    quickResponseFromCents: 35,
    quickResponseAtCents: 150,
    quickResponseMultiplier: 1.5,
    deadbandCents: 1.5,
    maxFrameMs: 50,
    distantScaleSemitones: 3,
} as const;

type Axis = { value: number; velocity: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const rangeSemitones = GAUGE_RANGE_CENTS / 100;

export function gaugeSnapshot(target: GaugeTarget): GaugeFrame {
    return { ...target, position: clamp(0.5 + target.offsetCents / (2 * GAUGE_RANGE_CENTS), 0, 1) };
}

/** Persistent, bounded motion for both the needle and its moving note scale. */
export default function createGaugeMotion() {
    let center: Axis | null = null;
    let offset: Axis | null = null;
    let absoluteTarget: number | null = null;
    let previousTime: number | null = null;

    function reset() {
        center = null;
        offset = null;
        absoluteTarget = null;
        previousTime = null;
    }

    function move(axis: Axis, target: number, seconds: number) {
        // Small integration steps keep the spring stable at different refresh rates.
        let remaining = seconds;
        while (remaining > 1e-9) {
            const step = Math.min(remaining, 1 / 120);
            const error = target - axis.value;
            // Keep small fluctuations calm; catch up sooner on deliberate note changes.
            const response = clamp((Math.abs(error) * 100 - GAUGE_MOTION.quickResponseFromCents) /
                (GAUGE_MOTION.quickResponseAtCents - GAUGE_MOTION.quickResponseFromCents), 0, 1);
            const omega = 2 / (GAUGE_MOTION.smoothingMs / 1000) *
                (1 + response * (GAUGE_MOTION.quickResponseMultiplier - 1));
            const accelerationLimit = GAUGE_MOTION.calmSemitonesAcceleration + response *
                (GAUGE_MOTION.maxSemitonesAcceleration - GAUGE_MOTION.calmSemitonesAcceleration);
            const acceleration = clamp(omega * omega * error - 2 * omega * axis.velocity,
                -accelerationLimit, accelerationLimit);
            axis.velocity = clamp(axis.velocity + acceleration * step,
                -GAUGE_MOTION.maxSemitonesPerSecond, GAUGE_MOTION.maxSemitonesPerSecond);
            const next = axis.value + axis.velocity * step;
            if (error * (target - next) <= 0) {
                axis.value = target;
                axis.velocity = 0;
            } else {
                axis.value = next;
            }
            remaining -= step;
        }
        if (Math.abs(target - axis.value) < 1e-6 && Math.abs(axis.velocity) < 1e-5) {
            axis.value = target;
            axis.velocity = 0;
        }
    }

    function update(target: GaugeTarget | null, timestamp: number, immediate = false): GaugeFrame | null {
        if (!target || !Number.isFinite(target.centerMidi) || !Number.isFinite(target.offsetCents) || !Number.isFinite(timestamp)) {
            reset();
            return null;
        }
        const nextAbsolute = target.centerMidi + target.offsetCents / 100;
        if (immediate || center === null || offset === null || previousTime === null) {
            center = { value: target.centerMidi, velocity: 0 };
            offset = { value: clamp(target.offsetCents / 100, -rangeSemitones, rangeSemitones), velocity: 0 };
            absoluteTarget = nextAbsolute;
            previousTime = timestamp;
            return gaugeSnapshot({ centerMidi: center.value, offsetCents: offset.value * 100 });
        }

        if (absoluteTarget === null || Math.abs(nextAbsolute - absoluteTarget) * 100 >= GAUGE_MOTION.deadbandCents) absoluteTarget = nextAbsolute;
        const seconds = clamp(timestamp - previousTime, 0, GAUGE_MOTION.maxFrameMs) / 1000;
        previousTime = timestamp;
        // A real large note change should not spend seconds scrolling the scale.
        // Rebase the labels while preserving the needle's existing offset/velocity.
        if (Math.abs(target.centerMidi - center.value) > GAUGE_MOTION.distantScaleSemitones) {
            center.value = target.centerMidi;
            center.velocity = 0;
        }
        move(center, target.centerMidi, seconds);
        move(offset, clamp(absoluteTarget - target.centerMidi, -rangeSemitones, rangeSemitones), seconds);
        return gaugeSnapshot({ centerMidi: center.value, offsetCents: offset.value * 100 });
    }

    return { update, reset };
}

