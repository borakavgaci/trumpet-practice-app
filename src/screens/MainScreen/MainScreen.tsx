
import { useState, useEffect } from "react";

import DeviceSelector from '../../components/DeviceSelector/DeviceSelector';
import NoteDisplay from '../../components/NoteDisplay/NoteDisplay';
import PianoKeyboard from '../../components/PianoKeyboard/PianoKeyboard';

import type {Device} from "/Users/bokav/Desktop/trumtrum/my-new-app/src/types/device.ts"

import useAudioDevices from '../../hooks/useAudioDevices';
import useMicrophoneInput from '../../hooks/useMicrophoneInput';
import usePitchDetection from '../../hooks/usePitchDetection';

import transposeNote from '../../utils/transposeNote';
import { PitchedNote } from '../../types/note';
import frequencyToPitchedNote from '../../utils/frequencyToPitchedNote';
import { PianoKey } from "../../data/pianoKeys";



export default function MainScreen() {

  const [activeKeys, setActiveKeys] = useState<number[]>([]);

  const {inputDevices, outputDevices, getAllDevices, selectedInputDeviceId, selectedOutputDeviceId, setSelectedInputDeviceId, setSelectedOutputDeviceId} = useAudioDevices();
  const {stream, isListening, error, startListening, stopListening} = useMicrophoneInput();
  const {volume, pitch, clarity} = usePitchDetection(stream);

  const concertNote = frequencyToPitchedNote(pitch);
  let trumpetNote: PitchedNote | null = null;

  if(concertNote === null) {
    trumpetNote = concertNote;
  }
  else {
    trumpetNote = transposeNote(concertNote,2);
  }

  function activeKey(midiNumber:number) {
    setActiveKeys(previousKeys => {
      if(previousKeys.includes(midiNumber)) {
        return previousKeys;
      }
      else {
        return previousKeys.concat(midiNumber);
      }
    });
  }

  function deactiveKey(midiNumber:number) {
    setActiveKeys(previousKeys => {
      const currentKeys = previousKeys.filter(keyId => keyId !== midiNumber);
      return currentKeys;
    });
  }

  

useEffect(() => {
    function handleWindowBlur() {
    setActiveKeys([]);
  }
  window.addEventListener("blur", handleWindowBlur);

  return () => {
    window.removeEventListener("blur", handleWindowBlur);
  };
}, []);


  return ( 
    <div>
      <button onClick={getAllDevices}>Load Devices</button>
      <button onClick={startListening}>Start Audio</button>
      <button onClick={stopListening}>Stop Audio</button>

      <DeviceSelector inputDevices = {inputDevices} outputDevices = {outputDevices} onInputDeviceChange = {setSelectedInputDeviceId} onOutputDeviceChange={setSelectedOutputDeviceId} selectedInputDeviceId={selectedInputDeviceId} selectedOutputDeviceId={selectedOutputDeviceId}/>
      <NoteDisplay concertNote={concertNote} trumpetNote={trumpetNote} frequency={pitch} isListening={isListening}/>


    <PianoKeyboard onActiveKey={activeKey} onDeactiveKey={deactiveKey} activeKeys={activeKeys}/>

    </div>
  );
}