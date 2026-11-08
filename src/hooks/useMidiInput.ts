import { useEffect, useRef, useState } from "react";

type MidiInputCallbacks = {
    onNoteOn: (midiNumber: number, velocity: number) => void;
    onNoteOff: (midiNumber: number) => void;
};

export default function useMidiInput({ onNoteOn, onNoteOff }: MidiInputCallbacks) {
    const [midiInputsArray, setMidiInputsArray] = useState<MIDIInput[]>([]);
    const [selectedMidiInputId, setSelectedMidiInputId] = useState("");
    const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
    const [midiError, setMidiError] = useState<string | null>(null);
    const [isMidiConnecting, setIsMidiConnecting] = useState(false);
    const callbacksRef = useRef({ onNoteOn, onNoteOff });
    const isMountedRef = useRef(false);
    const isConnectingRef = useRef(false);

    useEffect(() => {
        callbacksRef.current = { onNoteOn, onNoteOff };
    }, [onNoteOn, onNoteOff]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    async function initializeMidi() {
        if (isConnectingRef.current) return;

        isConnectingRef.current = true;
        setIsMidiConnecting(true);
        setMidiError(null);

        try {
            if (typeof navigator.requestMIDIAccess !== "function") {
                throw new Error("Bu ortam MIDI girişini desteklemiyor.");
            }

            const access = await navigator.requestMIDIAccess();
            if (isMountedRef.current) setMidiAccess(access);
        } catch (error) {
            if (isMountedRef.current) {
                setMidiError(error instanceof Error ? error.message : String(error));
            }
        } finally {
            isConnectingRef.current = false;
            if (isMountedRef.current) setIsMidiConnecting(false);
        }
    }

    useEffect(() => {
        if (midiAccess === null) return;

        function updateInputs() {
            const inputs = Array.from(midiAccess.inputs.values())
                .filter(input => input.state === "connected");
            setMidiInputsArray(inputs);
            setSelectedMidiInputId(currentId =>
                inputs.some(input => input.id === currentId) ? currentId : ""
            );
        }

        updateInputs();
        midiAccess.addEventListener("statechange", updateInputs);
        return () => {
            midiAccess.removeEventListener("statechange", updateInputs);
        };
    }, [midiAccess]);

    const selectedMidiInput = midiInputsArray.find((midiInput) => midiInput.id === selectedMidiInputId);

    useEffect(() => {
        if (selectedMidiInput === undefined || selectedMidiInput.state !== "connected") return;

        const heldNotes = new Map<number, Set<number>>();

        function releaseAllNotes() {
            const notes = Array.from(heldNotes.keys());
            heldNotes.clear();
            notes.forEach(note => callbacksRef.current.onNoteOff(note));
        }

        function handleMidiMessage(event: MIDIMessageEvent) {
            const data = event.data;
            if (!data || data.length < 3 || selectedMidiInput.state !== "connected") return;

            const command = data[0] & 0xf0;
            const channel = data[0] & 0x0f;
            const midiNumber = data[1];
            const velocity = data[2];
            if (midiNumber > 127 || velocity > 127) return;

            if (command === 0x90 && velocity > 0) {
                const channels = heldNotes.get(midiNumber) ?? new Set<number>();
                if (channels.has(channel)) return;

                const wasHeld = channels.size > 0;
                channels.add(channel);
                heldNotes.set(midiNumber, channels);
                if (!wasHeld) callbacksRef.current.onNoteOn(midiNumber, velocity / 127);
            } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
                const channels = heldNotes.get(midiNumber);
                if (!channels || !channels.delete(channel)) return;

                if (channels.size === 0) {
                    heldNotes.delete(midiNumber);
                    callbacksRef.current.onNoteOff(midiNumber);
                }
            }
        }

        function handleConnectionChange() {
            if (selectedMidiInput.state === "disconnected") releaseAllNotes();
        }

        selectedMidiInput.addEventListener("midimessage", handleMidiMessage);
        selectedMidiInput.addEventListener("statechange", handleConnectionChange);
        window.addEventListener("blur", releaseAllNotes);

        return () => {
            selectedMidiInput.removeEventListener("midimessage", handleMidiMessage);
            selectedMidiInput.removeEventListener("statechange", handleConnectionChange);
            window.removeEventListener("blur", releaseAllNotes);
            releaseAllNotes();
        };
    }, [selectedMidiInput]);

    return {
        initializeMidi, midiInputsArray, selectedMidiInputId, setSelectedMidiInputId,
        midiError, isMidiConnecting, isMidiReady: midiAccess !== null
    };
}
