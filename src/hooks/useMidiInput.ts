import { useEffect, useState } from "react";

export default function useMidiInput() {

    const [midiInputsArray, setMidiInputsArray] = useState<MIDIInput[]>([]);
    const [selectedMidiInputId, setSelectedMidiInputId] = useState("");

    async function initializeMidi() {
        const midiAccess = await navigator.requestMIDIAccess();
        const inputs = midiAccess.inputs.values();
        const detectedInputs = Array.from(inputs);
        setMidiInputsArray(detectedInputs);
    }
    const selectedMidiInput = midiInputsArray.find((midiInput) => midiInput.id === selectedMidiInputId);

    useEffect(() => {
        if (selectedMidiInput === undefined) {
            return;
        }

        function handleMidiMessage(event: MIDIMessageEvent) {
            console.log(event.data);
        }

        selectedMidiInput.addEventListener("midimessage", handleMidiMessage);

        return () => {
            selectedMidiInput.removeEventListener("midimessage", handleMidiMessage);
        };
    }, [selectedMidiInput]);

    return {
        initializeMidi, midiInputsArray, selectedMidiInputId, setSelectedMidiInputId
    }
}