
import { useState } from "react";
import { Device } from "../types/device";


export default function useAudioDevices() {

    const [inputDevices, setInputDevices] = useState<Device[]>([]);
    const [outputDevices, setOutputDevices] = useState<Device[]>([]);


    async function getAllDevices() {
        const rawDevices: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();

        const tempInputDevices = rawDevices.filter((rawDevice) => rawDevice.kind === "audioinput");
        const tempOutputDevices = rawDevices.filter((rawDevice) => rawDevice.kind === "audiooutput");

        const mappedInputDevices: Device[] = tempInputDevices.map((rawDevices) => 
            ({id: rawDevices.deviceId, label: rawDevices.label, kind: rawDevices.kind}));
        
        const mappedOutputDevices: Device[] = tempOutputDevices.map((rawDevices) => 
            ({id: rawDevices.deviceId, label: rawDevices.label, kind: rawDevices.kind}));

        setInputDevices(mappedInputDevices)
        setOutputDevices(mappedOutputDevices)


    }
    



    return {
        inputDevices,
        outputDevices,
        getAllDevices
    }
     


}