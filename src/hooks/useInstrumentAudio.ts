import * as Tone from "tone";
import { useCallback, useEffect, useRef, useState } from "react";
import c4SampleUrl from "../assets/samples/piano/samples_piano_C4.mp3";

import { pianoKeys } from "../data/pianoKeys";
import formatPitchedNote from "../utils/formatPitchedNote";

export default function useInstrumentAudio() {

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const samplerRef = useRef<Tone.Sampler | null>(null);

  const initializeAudio = useCallback(async () => {
    setError(null);
    try {
      await Tone.start();
      setIsAudioStarted(true);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : String(startError));
      setIsAudioStarted(false);
    }
  }, []);

   const playNote = useCallback((midiNumber: number, velocity = 1) => {
   if(isAudioStarted === true && isLoaded === true && samplerRef.current != null) {
        const foundKey = pianoKeys.find((pianoKey) => pianoKey.midiNumber === midiNumber);
        if(foundKey === undefined){
            return; 
        }
        const note = formatPitchedNote(foundKey);
        samplerRef.current.triggerAttack(note, undefined, Math.max(0, Math.min(1, velocity)));
   }
}, [isAudioStarted, isLoaded]);

   const stopNote = useCallback((midiNumber: number) => {
    if(samplerRef.current != null) {
        const foundKey = pianoKeys.find((pianoKey) => pianoKey.midiNumber === midiNumber);
        if(foundKey === undefined){
            return; 
        }
        const note = formatPitchedNote(foundKey);
        samplerRef.current.triggerRelease(note);
   }
   }, []);

   const stopAllNotes = useCallback(() => {
    if(samplerRef.current != null) {
        samplerRef.current.releaseAll();
    }
   }, []);

  useEffect(() => {
    let disposed = false;
    const sampler = new Tone.Sampler({
      urls: {
        C4: c4SampleUrl,
      },
      onload: () => {
        if (!disposed) setIsLoaded(true);
      },
      onerror: (loadError) => {
        if (!disposed) {
          setError(loadError.message);
          setIsLoaded(false);
        }
      }

      
    }).toDestination();

    samplerRef.current = sampler;

    return () => {
      disposed = true;
      sampler.dispose();
      samplerRef.current = null;
    };
  }, []);

  return {
      isLoaded, initializeAudio, error, isAudioStarted, playNote, stopNote, stopAllNotes
  };
}
