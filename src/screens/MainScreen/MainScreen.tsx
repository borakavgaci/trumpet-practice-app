

import DeviceSelector from '../../components/DeviceSelector/DeviceSelector';
import NoteDisplay from '../../components/NoteDisplay/NoteDisplay';
import PianoKeyboard from '../../components/PianoKeyboard/PianoKeyboard';

import type {Device} from "/Users/bokav/Desktop/trumtrum/my-new-app/src/types/device.ts"

import useAudioDevices from '../../hooks/useAudioDevices';
import transposeNote from '../../utils/transposeNote';
import { PitchedNote } from '../../types/note';



export default function MainScreen() {

  const {inputDevices, outputDevices, getAllDevices, selectedInputDeviceId, selectedOutputDeviceId, setSelectedInputDeviceId, setSelectedOutputDeviceId} = useAudioDevices();
  const concertNote: PitchedNote = {
    noteName: "B",
    octave: 2,
  }
  const trumpetNote = transposeNote(concertNote, 2);
  const frequency = 440
  const isListening = false


  return ( 
    <div>
      <button onClick={getAllDevices}>Load Devices</button>
      <DeviceSelector inputDevices = {inputDevices} outputDevices = {outputDevices} onInputDeviceChange = {setSelectedInputDeviceId} onOutputDeviceChange={setSelectedOutputDeviceId} selectedInputDeviceId={selectedInputDeviceId} selectedOutputDeviceId={selectedOutputDeviceId}/>
      <NoteDisplay concertNote={concertNote} trumpetNote={trumpetNote} frequency={frequency} isListening={isListening}/>
    <PianoKeyboard />
    </div>
  );
}