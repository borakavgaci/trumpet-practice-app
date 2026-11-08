import * as Tone from "tone";
import { useCallback, useEffect, useRef, useState } from "react";
import { instruments, instrumentIds, InstrumentId } from "../data/instruments";
import { pianoKeys } from "../data/pianoKeys";
import formatPitchedNote from "../utils/formatPitchedNote";

const unloadedInstruments = (): Record<InstrumentId, boolean> => ({
  piano: false,
  trumpet: false,
});

type OutputAudioContext = AudioContext & {
  setSinkId?: (deviceId: string) => Promise<void>;
};

export default function useInstrumentAudio() {
  const [instrument, setInstrument] = useState<InstrumentId>("piano");
  const [loadedInstruments, setLoadedInstruments] = useState(unloadedInstruments);
  const [loadErrors, setLoadErrors] = useState<Partial<Record<InstrumentId, string>>>({});
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [isAudioStarting, setIsAudioStarting] = useState(false);
  const [outputDeviceId, setOutputDeviceId] = useState("");
  const [outputError, setOutputError] = useState<string | null>(null);
  const [canSelectOutput, setCanSelectOutput] = useState(false);
  const [isOutputChanging, setIsOutputChanging] = useState(false);
  const contextRef = useRef<Tone.Context | null>(null);
  const outputChangingRef = useRef(false);
  const samplersRef = useRef<Partial<Record<InstrumentId, Tone.Sampler>>>({});
  const loadedRef = useRef(unloadedInstruments());
  const instrumentRef = useRef<InstrumentId>("piano");
  const activeNotesRef = useRef(new Map<string, number>());
  const isAudioStartedRef = useRef(false);
  const isAudioStartingRef = useRef(false);
  const isMountedRef = useRef(false);

  const resumeHeldNotes = useCallback((id: InstrumentId) => {
    const sampler = samplersRef.current[id];
    if (!isMountedRef.current || instrumentRef.current !== id ||
        !isAudioStartedRef.current || !loadedRef.current[id] || !sampler) return;

    activeNotesRef.current.forEach((velocity, note) => {
      sampler.triggerAttack(note, undefined, velocity);
    });
  }, []);

  const initializeAudio = useCallback(async () => {
    const context = contextRef.current;
    if (!context || isAudioStartedRef.current || isAudioStartingRef.current) return;

    isAudioStartingRef.current = true;
    setIsAudioStarting(true);
    setAudioError(null);
    try {
      await context.resume();
      if (!isMountedRef.current) return;

      isAudioStartedRef.current = true;
      setIsAudioStarted(true);
      resumeHeldNotes(instrumentRef.current);
    } catch (startError) {
      if (isMountedRef.current) {
        setAudioError(startError instanceof Error ? startError.message : String(startError));
      }
    } finally {
      isAudioStartingRef.current = false;
      if (isMountedRef.current) setIsAudioStarting(false);
    }
  }, [resumeHeldNotes]);

  const selectOutput = useCallback(async (deviceId: string) => {
    const context = contextRef.current?.rawContext as OutputAudioContext | undefined;
    if (!context || outputChangingRef.current) return;
    if (typeof context.setSinkId !== "function") {
      if (deviceId) setOutputError("Bu ortamda ses çıkışı seçimi desteklenmiyor.");
      return;
    }
    outputChangingRef.current = true;
    setIsOutputChanging(true);
    setOutputError(null);
    try {
      await context.setSinkId(deviceId);
      if (isMountedRef.current) setOutputDeviceId(deviceId);
    } catch (error) {
      if (isMountedRef.current) setOutputError(error instanceof Error ? error.message : String(error));
    } finally {
      outputChangingRef.current = false;
      if (isMountedRef.current) setIsOutputChanging(false);
    }
  }, []);

  const selectInstrument = useCallback((nextInstrument: InstrumentId) => {
    if (nextInstrument === instrumentRef.current) return;

    samplersRef.current[instrumentRef.current]?.releaseAll();
    instrumentRef.current = nextInstrument;
    setInstrument(nextInstrument);
    resumeHeldNotes(nextInstrument);
  }, [resumeHeldNotes]);

  const playNote = useCallback((midiNumber: number, velocity = 1) => {
    if (!isMountedRef.current) return;
    const key = pianoKeys.find(pianoKey => pianoKey.midiNumber === midiNumber);
    if (!key) return;

    const note = formatPitchedNote(key);
    const strength = Number.isFinite(velocity) ? Math.max(0, Math.min(1, velocity)) : 1;
    activeNotesRef.current.set(note, strength);
    const id = instrumentRef.current;
    if (isAudioStartedRef.current && loadedRef.current[id]) {
      samplersRef.current[id]?.triggerAttack(note, undefined, strength);
    }
  }, []);

  const stopNote = useCallback((midiNumber: number) => {
    const key = pianoKeys.find(pianoKey => pianoKey.midiNumber === midiNumber);
    if (!key) return;

    const note = formatPitchedNote(key);
    activeNotesRef.current.delete(note);
    samplersRef.current[instrumentRef.current]?.triggerRelease(note);
  }, []);

  const stopAllNotes = useCallback(() => {
    activeNotesRef.current.clear();
    instrumentIds.forEach(id => samplersRef.current[id]?.releaseAll());
  }, []);

  useEffect(() => {
    let disposed = false;
    isMountedRef.current = true;
    // Own a native context so output selection applies directly to both samplers.
    const context = new Tone.Context(new AudioContext({ latencyHint: "interactive" }));
    contextRef.current = context;
    setCanSelectOutput(typeof (context.rawContext as OutputAudioContext).setSinkId === "function");
    loadedRef.current = unloadedInstruments();
    setLoadedInstruments(unloadedInstruments());

    instrumentIds.forEach(id => {
      const definition = instruments[id];
      const sampler = new Tone.Sampler({
        context,
        urls: definition.urls,
        release: definition.release,
        volume: definition.volume,
        onload: () => {
          if (disposed) return;

          loadedRef.current[id] = true;
          setLoadedInstruments(current => ({ ...current, [id]: true }));
          setLoadErrors(current => ({ ...current, [id]: undefined }));
          resumeHeldNotes(id);
        },
        onerror: loadError => {
          if (disposed) return;

          loadedRef.current[id] = false;
          setLoadedInstruments(current => ({ ...current, [id]: false }));
          setLoadErrors(current => ({
            ...current,
            [id]: loadError instanceof Error ? loadError.message : String(loadError),
          }));
        },
      }).toDestination();

      samplersRef.current[id] = sampler;
      if (loadedRef.current[id]) resumeHeldNotes(id);
    });

    return () => {
      disposed = true;
      isMountedRef.current = false;
      activeNotesRef.current.clear();
      instrumentIds.forEach(id => {
        samplersRef.current[id]?.releaseAll();
        samplersRef.current[id]?.dispose();
      });
      samplersRef.current = {};
      loadedRef.current = unloadedInstruments();
      contextRef.current = null;
      context.dispose();
    };
  }, [resumeHeldNotes]);

  return {
    instrument,
    selectInstrument,
    isLoaded: loadedInstruments[instrument],
    initializeAudio,
    error: loadErrors[instrument] ?? audioError,
    isAudioStarted,
    isAudioStarting,
    playNote,
    stopNote,
    stopAllNotes,
    outputDeviceId,
    selectOutput,
    outputError,
    canSelectOutput,
    isOutputChanging,
  };
}
