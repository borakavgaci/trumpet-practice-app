import type {DeviceSelectorProps} from "/Users/bokav/Desktop/trumtrum/my-new-app/src/types/device.ts"
import type { Device } from "/Users/bokav/Desktop/trumtrum/my-new-app/src/types/device.ts";

import useAudioDevices from "../../hooks/useAudioDevices";
import { ChangeEvent } from "react";

export default function DeviceSelector({inputDevices, outputDevices, selectedInputDeviceId, selectedOutputDeviceId, onInputDeviceChange, onOutputDeviceChange}: DeviceSelectorProps) {
 
  function handleInputDeviceChange(changeEvent: ChangeEvent<HTMLSelectElement>) {
    selectedInputDeviceId = changeEvent.target.value
    console.log((inputDevices.find((Device) => Device.id === selectedInputDeviceId))?.label)
    return selectedInputDeviceId;
  }
  function handleOutputDeviceChange(changeEvent: ChangeEvent<HTMLSelectElement>) {
    selectedOutputDeviceId = changeEvent.target.value
    console.log((outputDevices.find((Device) => Device.id === selectedOutputDeviceId))?.label)
    return selectedOutputDeviceId;
  }

 
  return (
    <div>
      <h1>Device Selector</h1>
      

      <h2>Input Devices</h2>
      <select onChange={handleInputDeviceChange} value={selectedInputDeviceId}>
      {inputDevices.map((Devices) => (<option key={Devices.id} value={Devices.id}>{Devices.label}</option>))}
      </select>
    
      <h2>Output Devices</h2>
      <select onChange={handleOutputDeviceChange} value={selectedOutputDeviceId}>
      {outputDevices.map((Devices) => (<option key={Devices.id} value={Devices.id}>{Devices.label}</option>))}
      </select>

    </div>
  );
}