export type Device = {
  id: string;
  label: string;
  kind: string;
}
export type DeviceSelectorProps = {
  inputDevices: Device[];
  outputDevices: Device[];
}