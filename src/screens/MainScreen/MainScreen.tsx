
import { useState, useEffect } from "react";

import DeviceSelector from '../../components/DeviceSelector/DeviceSelector';
import NoteDisplay from '../../components/NoteDisplay/NoteDisplay';
import PianoKeyboard from '../../components/PianoKeyboard/PianoKeyboard';

import type {Device} from "/Users/bokav/Desktop/trumtrum/my-new-app/src/types/device.ts"

import useAudioDevices from '../../hooks/useAudioDevices';
import useMicrophoneInput from '../../hooks/useMicrophoneInput';
import usePitchDetection from '../../hooks/usePitchDetection';
import useMidiInput from "../../hooks/useMidiInput";

import transposeNote from '../../utils/transposeNote';
import { PitchedNote } from '../../types/note';
import frequencyToPitchedNote from '../../utils/frequencyToPitchedNote';
import { PianoKey } from "../../data/pianoKeys";


import useInstrumentAudio from "../../hooks/useInstrumentAudio";



export default function MainScreen() {

  const [activeKeys, setActiveKeys] = useState<number[]>([]);

  const {inputDevices, outputDevices, getAllDevices, selectedInputDeviceId, selectedOutputDeviceId, setSelectedInputDeviceId, setSelectedOutputDeviceId} = useAudioDevices();
  const {stream, isListening, error, startListening, stopListening} = useMicrophoneInput();
  const {volume, pitch, clarity} = usePitchDetection(stream);
  const {initializeAudio, playNote, stopNote, stopAllNotes} = useInstrumentAudio();
  const {initializeMidi, midiInputsArray} = useMidiInput();

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
    playNote(midiNumber);
  }

  function deactiveKey(midiNumber:number) {
    setActiveKeys(previousKeys => {
      const currentKeys = previousKeys.filter(keyId => keyId !== midiNumber);
      return currentKeys;
    });
    stopNote(midiNumber);
  }

  

useEffect(() => {
    function handleWindowBlur() {
    setActiveKeys([]);
    stopAllNotes();
  }
  window.addEventListener("blur", handleWindowBlur);

  return () => {
    window.removeEventListener("blur", handleWindowBlur);
  };
}, [stopAllNotes]);


  return ( 
    <div>
      <button onClick={getAllDevices}>Load Devices</button>
      <button onClick={startListening}>Start Audio</button>
      <button onClick={stopListening}>Stop Audio</button>

      <DeviceSelector inputDevices = {inputDevices} outputDevices = {outputDevices} onInputDeviceChange = {setSelectedInputDeviceId} onOutputDeviceChange={setSelectedOutputDeviceId} selectedInputDeviceId={selectedInputDeviceId} selectedOutputDeviceId={selectedOutputDeviceId}/>
      <NoteDisplay concertNote={concertNote} trumpetNote={trumpetNote} frequency={pitch} isListening={isListening}/>

    <button onClick={initializeAudio}>Start Piano</button>
    <button onClick={initializeMidi}>MIDI Bağla</button>
    <select>{midiInputsArray.map((midiInput) => <option key={midiInput.id} value={midiInput.id}>{midiInput.name}</option>)}</select>
    <PianoKeyboard onActiveKey={activeKey} onDeactiveKey={deactiveKey} activeKeys={activeKeys}/>

    </div>
  );
}