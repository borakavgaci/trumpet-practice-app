import { useEffect, useState } from "react";
import { PitchDetector } from "pitchy";

export default function usePitchDetection(stream: MediaStream | null) {
      
    const [volume, setVolume] = useState(0);
    const [pitch, setPitch] = useState(null);
    const [clarity, setClarity] = useState(0);
    
    useEffect(() => {
        if (stream === null) {
            console.log("stream is null");
            return;
        }


         
        
            const audioCtx = new AudioContext();
            
            const source = audioCtx.createMediaStreamSource(stream);
            
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 1024;
            const bufferLength = analyser.fftSize;
            const dataArray = new Float32Array(bufferLength);

            source.connect(analyser);
            const detector = PitchDetector.forFloat32Array(dataArray.length);


            function analyze() {
            
                let sumOfSquares = 0;

                analyser.getFloatTimeDomainData(dataArray)
                dataArray.forEach((value) => sumOfSquares += value*value);

                const avg = sumOfSquares / dataArray.length;
                const avgSqrt = Math.sqrt(avg);
                setVolume(avgSqrt);

                const [pitch, clarity] = detector.findPitch(dataArray, audioCtx.sampleRate);

                 setPitch(pitch);
                setClarity(clarity);
                requestAnimationFrame(analyze)
            }

            
           




        
            analyze();
                
        
        
        return () => {
            source.disconnect();
            analyser.disconnect();
            audioCtx.close();
        };
    },[stream]);

    return {
            volume,
            pitch,
            clarity
    }
}