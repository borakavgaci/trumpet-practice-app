import DeviceSelector from '../../components/DeviceSelector/DeviceSelector';
import NoteDisplay from '../../components/NoteDisplay/NoteDisplay';
import PianoKeyboard from '../../components/PianoKeyboard/PianoKeyboard';

import type {Device} from "/Users/bokav/Desktop/trumtrum/my-new-app/src/types/device.ts"


const inputDevices: Device[] = [
  { id: '1', label: 'Microphone 1', kind: 'audioinput' },
  { id: '2', label: 'Microphone 2', kind: 'audioinput' },
];

const outputDevices: Device[] = [
  { id: '3', label: 'Speaker 1', kind: 'audiooutput' },
  { id: '4', label: 'Speaker 2', kind: 'audiooutput' },
];



export default function MainScreen() {
  return (
    <div>
      <DeviceSelector inputDevices = {inputDevices} outputDevices = {outputDevices}/>
      <NoteDisplay />
    <PianoKeyboard />
    </div>
  );
}