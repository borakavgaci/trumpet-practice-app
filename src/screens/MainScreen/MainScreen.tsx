

import DeviceSelector from '../../components/DeviceSelector/DeviceSelector';
import NoteDisplay from '../../components/NoteDisplay/NoteDisplay';
import PianoKeyboard from '../../components/PianoKeyboard/PianoKeyboard';

import type {Device} from "/Users/bokav/Desktop/trumtrum/my-new-app/src/types/device.ts"

import useAudioDevices from '../../hooks/useAudioDevices';




export default function MainScreen() {

  const {inputDevices, outputDevices, getAllDevices} = useAudioDevices();

  return (
    <div>
      <button onClick={getAllDevices}>Load Devices</button>
      <DeviceSelector inputDevices = {inputDevices} outputDevices = {outputDevices}/>
      <NoteDisplay />
    <PianoKeyboard />
    </div>
  );
}