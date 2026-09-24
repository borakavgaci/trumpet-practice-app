import DeviceSelector from '../../components/DeviceSelector/DeviceSelector';
import NoteDisplay from '../../components/NoteDisplay/NoteDisplay';
import PianoKeyboard from '../../components/PianoKeyboard/PianoKeyboard';

export default function MainScreen() {
  return (
    <div>
      <DeviceSelector />
      <NoteDisplay />
      <PianoKeyboard />
    </div>
  );
}