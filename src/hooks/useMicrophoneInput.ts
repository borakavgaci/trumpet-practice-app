import { useState } from "react";


export default function useMicrophoneInput() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isListening, setIsListening] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);


    async function startListening() {
        setError(null);

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true});
            setStream(mediaStream);
            setIsListening(true);
            console.log("startListening called!")
            console.log("isListening", isListening);
            console.log(mediaStream);

        }
        catch (error) {
            setError(String(error));
            console.log(error);
            setIsListening(false);
        }
    }

    function stopListening() {

        
            if(stream != null) {
                
                const tracks = stream.getTracks();
                tracks.forEach((track) => track.stop());

                setStream(null);
                setIsListening(false);
                setError(null);
                console.log("stopListening called!")
               
            }
        
        
    }

   

    return {
        stream,
        isListening,
        error,
        startListening,
        stopListening
    }
}