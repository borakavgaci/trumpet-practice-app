

import DeviceSelector from '../../components/DeviceSelector/DeviceSelector';
import NoteDisplay from '../../components/NoteDisplay/NoteDisplay';
import PianoKeyboard from '../../components/PianoKeyboard/PianoKeyboard';

import type {Device} from "/Users/bokav/Desktop/trumtrum/my-new-app/src/types/device.ts"

import useAudioDevices from '../../hooks/useAudioDevices';
import useMicrophoneInput from '../../hooks/useMicrophoneInput';

import transposeNote from '../../utils/transposeNote';
import { PitchedNote } from '../../types/note';



export default function MainScreen() {

  const {inputDevices, outputDevices, getAllDevices, selectedInputDeviceId, selectedOutputDeviceId, setSelectedInputDeviceId, setSelectedOutputDeviceId} = useAudioDevices();
  const {stream, isListening, error, startListening, stopListening} = useMicrophoneInput();
  const concertNote: PitchedNote = {
    noteName: "B",
    octave: 2,
  }
  const trumpetNote = transposeNote(concertNote, 2);
  const frequency = 440
  


  return ( 
    <div>
      <button onClick={getAllDevices}>Load Devices</button>
      <button onClick={startListening}>Start Audio</button>
      <button onClick={stopListening}>Stop Audio</button>

      <DeviceSelector inputDevices = {inputDevices} outputDevices = {outputDevices} onInputDeviceChange = {setSelectedInputDeviceId} onOutputDeviceChange={setSelectedOutputDeviceId} selectedInputDeviceId={selectedInputDeviceId} selectedOutputDeviceId={selectedOutputDeviceId}/>
      <NoteDisplay concertNote={concertNote} trumpetNote={trumpetNote} frequency={frequency} isListening={isListening}/>
    <PianoKeyboard />
    </div>
  );
}