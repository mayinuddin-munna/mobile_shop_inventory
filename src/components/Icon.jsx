const ICONS = {
  mobile:
    "M12 17v.01M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  dashboard:
    "M4 4h7v7H4Zm9 0h7v4h-7Zm0 6h7v10h-7ZM4 13h7v7H4Z",
  receipt:
    "M8 4h8l4 4v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 9h8M8 17h5M14 4v4h4",
  headphones:
    "M4 12a8 8 0 1 1 16 0v4a2 2 0 0 1-2 2h-1v-5h3M4 13h3v5H6a2 2 0 0 1-2-2Z",
  tool:
    "m14 6 4 4m-7.5 7.5 7-7M7 16l-3 3m11.5-11.5a2.121 2.121 0 0 0-3 3l-7.5 7.5a2 2 0 0 0 0 3l.5.5a2 2 0 0 0 3 0l7.5-7.5a2.121 2.121 0 0 0 3-3Z",
  alert:
    "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
  bell:
    "M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m3 0a3 3 0 0 1-6 0m6 0H9",
  chart:
    "M4 19h16M7 16V9m5 7V5m5 11v-6",
  truck:
    "M10 17h4M3 6h11v8H3Zm11 3h3l2-3V9h-5m-7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm11 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  users:
    "M9 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 1a2.5 2.5 0 1 0 0 5M3.5 19a5.5 5.5 0 0 1 11 0m2.5 0a4.5 4.5 0 0 1 4-3",
  settings:
    "M10.3 4.3 12 3l1.7 1.3 2.1-.3.9 2 1.9 1.1-.3 2.1L21 11l-1.3 1.7.3 2.1-2 1-1 1.9-2.1-.3L12 21l-1.7-1.3-2.1.3-1-2-1.9-1 .3-2.1L3 11l1.3-1.7-.3-2.1 2-1 .9-2 2.1.3ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  menu:
    "M4 7h16M4 12h16M4 17h16",
  search:
    "m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
  plus: "M12 5v14M5 12h14",
  edit:
    "M4 20h4l10.5-10.5a2.121 2.121 0 0 0-3-3L5 17v3Zm9.5-12.5 3 3",
  cart:
    "M5 5h2l1.4 7h8.8l1.6-5H8.6M9 19a1.5 1.5 0 1 0 0 .01M17 19a1.5 1.5 0 1 0 0 .01",
  trash:
    "M4 7h16M9 7V4h6v3m-7 4v6m4-6v6m4-6v6M6 7l1 12h10l1-12",
  check:
    "m5 12 4 4L19 6",
  close:
    "M6 6l12 12M18 6 6 18",
  packageOff:
    "M7 7.5 12 10l5-2.5M12 10v7m8-3V8l-8-4-8 4v6l8 4 3.5-1.75M4 4l16 16"
};

export default function Icon({ name, className = "", size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={ICONS[name] || ICONS.mobile} />
    </svg>
  );
}
