import { useEffect, useRef, useState } from "react";
import createGaugeMotion, { GaugeFrame, GaugeTarget, gaugeSnapshot } from "../utils/createGaugeMotion";

export default function useGaugeMotion(target: GaugeTarget | null): GaugeFrame | null {
    const targetRef = useRef(target);
    const motion = useRef<ReturnType<typeof createGaugeMotion> | null>(null);
    if (motion.current === null) motion.current = createGaugeMotion();
    const [frame, setFrame] = useState<GaugeFrame | null>(() => target ? gaugeSnapshot(target) : null);
    const active = target !== null;

    useEffect(() => { targetRef.current = target; }, [target?.centerMidi, target?.offsetCents, active]);

    useEffect(() => {
        const animation = motion.current;
        if (animation === null) return;
        if (!active) {
            animation.reset();
            setFrame(null);
            return;
        }
        let frameId: number;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        setFrame(animation.update(targetRef.current, performance.now(), reducedMotion.matches));
        function animate(timestamp: number) {
            const next = animation.update(targetRef.current, timestamp, reducedMotion.matches);
            setFrame(previous => previous && next &&
                Math.abs(previous.centerMidi - next.centerMidi) < 1e-7 &&
                Math.abs(previous.offsetCents - next.offsetCents) < 1e-5 ? previous : next);
            frameId = requestAnimationFrame(animate);
        }
        frameId = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(frameId);
            animation.reset();
        };
    }, [active]);

    return target === null ? null : frame ?? gaugeSnapshot(target);
}
