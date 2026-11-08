import type { DeviceSelectorProps } from "../../types/device";

export default function DeviceSelector({ inputDevices, selectedInputDeviceId, onInputDeviceChange, disabled = false }: DeviceSelectorProps) {
  return (
    <label className="select-field">
      <span className="sr-only">Mikrofon</span>
      <select aria-label="Mikrofon" value={selectedInputDeviceId} onChange={event => onInputDeviceChange(event.currentTarget.value)} disabled={disabled}>
        <option value="">Sistem varsayılanı</option>
        {inputDevices.filter(device => device.id && device.id !== "default").map((device, index) => (
          <option key={device.id} value={device.id}>{device.label || `Mikrofon ${index + 1}`}</option>
        ))}
      </select>
    </label>
  );
}
