import type {DeviceSelectorProps} from "/Users/bokav/Desktop/trumtrum/my-new-app/src/types/device.ts"


export default function DeviceSelector({inputDevices, outputDevices}: DeviceSelectorProps) {
 

 
  return (
    <div>
      <h1>Device Selector</h1>
      <h2>Input Devices</h2>
      {inputDevices.map((Devices) => (<p key={Devices.id}>{Devices.label}</p>))}
    
      <h2>Output Devices</h2>
      {outputDevices.map((Devices) => (<p key={Devices.id}>{Devices.label}</p>))}

    </div>
  );
}