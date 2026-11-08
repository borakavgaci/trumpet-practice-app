import { useEffect, useState } from "react";
import { PitchDetector } from "pitchy";
import { PitchTuning } from "../types/pitchTuning";
import createPitchTracker from "../utils/createPitchTracker";

type PitchReading = {
    volume: number;
    pitch: number | null;
    clarity: number;
    tuning: PitchTuning | null;
};

const EMPTY_READING: PitchReading = { volume: 0, pitch: null, clarity: 0, tuning: null };

export default function usePitchDetection(stream: MediaStream | null) {
    const [reading, setReading] = useState<PitchReading>(EMPTY_READING);

    useEffect(() => {
        if (stream === null) {
            setReading(EMPTY_READING);
            return;
        }

        let animationFrameId: number | null = null;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const dataArray = new Float32Array(analyser.fftSize);
        source.connect(analyser);
        const detector = PitchDetector.forFloat32Array(dataArray.length);
        const tracker = createPitchTracker();

        function analyze(timestamp = performance.now()) {
            analyser.getFloatTimeDomainData(dataArray);
            let sumOfSquares = 0;
            dataArray.forEach(value => { sumOfSquares += value * value; });
            const volume = Math.sqrt(sumOfSquares / dataArray.length);
            const [frequency, clarity] = detector.findPitch(dataArray, audioCtx.sampleRate);
            const pitch = Number.isFinite(frequency) && frequency > 0 && volume >= 0.01 &&
                Number.isFinite(clarity) && clarity >= 0.9 ? frequency : null;

            setReading({ volume, pitch, clarity, tuning: tracker.update(pitch, timestamp) });
            animationFrameId = requestAnimationFrame(analyze);
        }

        analyze();
        return () => {
            if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
            tracker.reset();
            source.disconnect();
            analyser.disconnect();
            void audioCtx.close();
        };
    }, [stream]);

    // Stopping the microphone hides the previous reading immediately, before effects run.
    return stream === null ? EMPTY_READING : reading;
}
