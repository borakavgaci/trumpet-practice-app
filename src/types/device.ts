export type Device = {
  id: string;
  label: string;
  kind: string;
}
export type DeviceSelectorProps = {
  inputDevices: Device[];
  outputDevices: Device[];
  
  selectedInputDeviceId: string;
  selectedOutputDeviceId: string;
  onInputDeviceChange: (deviceId: string) => void;
  onOutputDeviceChange: (deviceId: string) => void;


}