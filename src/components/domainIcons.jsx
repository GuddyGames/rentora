// Custom icons for equipment categories and event types, in the same
// stroke-based style as components/icons.jsx. These replace the emoji that
// were standing in as placeholders — each one is a small hand-built line
// drawing rather than a system emoji, so it renders identically everywhere
// and actually matches the app's visual language.
const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }

// ---- equipment categories ----
export function CanopyIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M2 10 12 4l10 6" /><path d="M4 10v8M20 10v8M8 10v8M16 10v8" /><path d="M2 10h20" /></svg>) }
export function ChairsIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M6 3v9M6 12h9M15 3v14" /><path d="M6 12v8M15 17v4" /></svg>) }
export function TablesIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><ellipse cx="12" cy="7" rx="9" ry="3" /><path d="M6 8.5V16M18 8.5V16" /></svg>) }
export function TentIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 3v4M3 20 12 7l9 13" /><path d="M8 20 12 13l4 7" /></svg>) }
export function StageIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="14" width="18" height="6" rx="1" /><path d="M6 14 8 4h8l2 10" /></svg>) }
export function SoundIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="8" r="2.3" /><circle cx="12" cy="16" r="3.3" /></svg>) }
export function DjIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><circle cx="7" cy="12" r="5" /><circle cx="17" cy="12" r="5" /><circle cx="7" cy="12" r="1" /><circle cx="17" cy="12" r="1" /></svg>) }
export function LightingIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M9 3h6l-1 8h3l-8 11 2-9H8l1-10Z" /></svg>) }
export function LedScreenIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="2" y="4" width="20" height="13" rx="1.5" /><path d="M8 21h8M12 17v4" /></svg>) }
export function ProjectorIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="2" y="7" width="14" height="9" rx="2" /><circle cx="9" cy="11.5" r="2.6" /><path d="M16 10l6-2v8l-6-2" /></svg>) }
export function MicrophoneIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4M9 22h6" /></svg>) }
export function DecorationIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 3v3M4 10h3M17 10h3M6 20l6-9 6 9" /><path d="M9 20h6" /></svg>) }
export function CoolingFanIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="2" /><path d="M12 10c0-4 2-7 5-7s2 5-1 7M14 12c4 0 7 2 7 5s-5 2-7-1M12 14c0 4-2 7-5 7s-2-5 1-7M10 12c-4 0-7-2-7-5s5-2 7 1" /></svg>) }
export function GeneratorIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="2" y="8" width="16" height="10" rx="1.5" /><circle cx="7" cy="13" r="1.8" /><circle cx="13" cy="13" r="1.8" /><path d="M18 11h2l2 3v4h-4" /></svg>) }
export function ToiletIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="5" y="2" width="14" height="14" rx="2" /><path d="M8 22v-3a4 4 0 0 1 8 0v3" /><path d="M9 7h6" /></svg>) }
export function PartyAccessoriesIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M4 4l7 16 9-13L4 4Z" /><circle cx="18" cy="6" r="1" /><circle cx="20" cy="10" r="1" /></svg>) }

// ---- event types ----
export function WeddingIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><circle cx="8" cy="15" r="5" /><circle cx="16" cy="15" r="5" /><path d="M12 5l1.8 3.6L18 9l-3 2.7.7 4-3.7-2-3.7 2 .7-4L5 9l4.2-.4L12 5Z" /></svg>) }
export function BirthdayIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7H4Z" /><path d="M4 17h16M8 12V8M12 12V8M16 12V8" /><path d="M8 8c0-1 1-1 1-2s-1-1-1-2M12 8c0-1 1-1 1-2s-1-1-1-2M16 8c0-1 1-1 1-2s-1-1-1-2" /></svg>) }
export function ConferenceIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><rect x="3" y="3" width="18" height="14" rx="1.5" /><path d="M8 21h8M12 17v4" /><path d="M7 12l3-3 3 2 4-4" /></svg>) }
export function GraduationIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M2 9l10-4 10 4-10 4-10-4Z" /><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6" /></svg>) }
export function ConcertIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M9 18V5l10-2v13" /><circle cx="7" cy="18" r="2.3" /><circle cx="17" cy="16" r="2.3" /></svg>) }
export function EngagementIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 4 9 9h6l-3-5Z" /><circle cx="12" cy="15" r="6" /></svg>) }
export function HousePartyIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-5h4v5" /></svg>) }
export function MemorialIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M12 2c-1.5 3-1.5 5 0 6 1.5-1 1.5-3 0-6Z" /><rect x="9" y="8" width="6" height="13" rx="1" /></svg>) }

// ---- indoor / outdoor (Plan My Event "setting" step) ----
export function OutdoorIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>) }
export function IndoorIcon(p) { return (<svg viewBox="0 0 24 24" {...s} {...p}><path d="M4 21V10l8-6 8 6v11" /><path d="M9 21v-6h6v6" /></svg>) }
