type IconName = "microphone" | "piano" | "midi" | "refresh" | "play" | "stop" | "arrow" | "sound";

const paths: Record<IconName, string> = {
  microphone: "M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm-6-4v1a6 6 0 0 0 12 0v-1M12 18v3m-3 0h6",
  piano: "M4 4h16v16H4zM8 4v10h3V4m2 0v10h3V4M9 14v6m6-6v6",
  midi: "M8 5h8v4H8zM12 2v3M7 9h10v4a5 5 0 0 1-10 0V9Zm3 3v2m4-2v2m-2 4v4",
  refresh: "M20 11a8 8 0 0 0-14-5L3 9m0-5v5h5m-4 4a8 8 0 0 0 14 5l3-3m0 5v-5h-5",
  play: "m9 5 11 7-11 7V5Z",
  stop: "M6 6h12v12H6z",
  arrow: "m9 5 7 7-7 7",
  sound: "m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
};

export default function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
