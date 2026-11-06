import * as Tone from "tone";
import { useEffect, useRef, useState } from "react";
import c4SampleUrl from "../assets/samples/piano/samples_piano_C4.mp3";

import { pianoKeys } from "../data/pianoKeys";
import formatPitchedNote from "../utils/formatPitchedNote";

export default function useInstrumentAudio() {

  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const samplerRef = useRef<Tone.Sampler | null>(null);

  async function initializeAudio() {
    
	await Tone.start();
	console.log("audio is ready");

    setIsAudioStarted(true);
}

   function playNote(midiNumber:number) {
   if(isAudioStarted === true && isLoaded === true && samplerRef.current != null) {
        const foundKey = pianoKeys.find((pianoKey) => pianoKey.midiNumber === midiNumber);
        if(foundKey === undefined){
            return; 
        }
        const note = formatPitchedNote(foundKey);
        samplerRef.current.triggerAttack(note);
   }
}

   function stopNote(midiNumber:number) {
    if(isAudioStarted === true && isLoaded === true && samplerRef.current != null) {
        const foundKey = pianoKeys.find((pianoKey) => pianoKey.midiNumber === midiNumber);
        if(foundKey === undefined){
            return; 
        }
        const note = formatPitchedNote(foundKey);
        samplerRef.current.triggerRelease(note);
   }
   }

   function stopAllNotes() {
    if(samplerRef.current != null) {
        samplerRef.current.releaseAll();
    }
   }

  useEffect(() => {
    const sampler = new Tone.Sampler({
      urls: {
        C4: c4SampleUrl,
      },
      onload: () => {
        setIsLoaded(true);
      },
      onerror: (loadError) => {
        setError(loadError.message)
        setIsLoaded(false);
      }

      
    }).toDestination();

    samplerRef.current = sampler;

    return () => {
      sampler.dispose();
      samplerRef.current = null;
    };
  }, []);

  return {
      isLoaded, initializeAudio, error, isAudioStarted, playNote, stopNote, stopAllNotes
  };
}