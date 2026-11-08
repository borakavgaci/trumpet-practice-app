export type Device = {
  id: string;
  label: string;
  kind: string;
}
export type DeviceSelectorProps = {
  inputDevices: Device[];
  selectedInputDeviceId: string;
  onInputDeviceChange: (deviceId: string) => void;
  disabled?: boolean;
}
