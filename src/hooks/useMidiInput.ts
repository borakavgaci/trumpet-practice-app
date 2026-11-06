import { useState } from "react";

export default function useMidiInput() {

    const [midiInputsArray, setMidiInputsArray] = useState<MIDIInput[]>([]);

    async function initializeMidi() {
        const midiAccess = await navigator.requestMIDIAccess();
        const inputs = midiAccess.inputs.values();
        const detectedInputs = Array.from(inputs);
        setMidiInputsArray(detectedInputs);
    }

    return {
        initializeMidi, midiInputsArray
    }
}