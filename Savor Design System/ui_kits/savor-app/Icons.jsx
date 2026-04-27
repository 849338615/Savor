/* global React */
const { useState } = React;

// ---------- Lucide-style inline icons (1.75 stroke, rounded) ----------
const Icon = ({ d, size = 22, fill = "none", children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth="1.75"
       strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d}/> : children}
  </svg>
);

const SearchIcon = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></Icon>;
const TimerIcon = (p) => <Icon {...p}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></Icon>;
const BookmarkIcon = ({filled, ...p}) => (
  <Icon {...p} fill={filled ? "currentColor" : "none"}>
    <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </Icon>
);
const HeartIcon = ({filled, ...p}) => (
  <Icon {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </Icon>
);
const UsersIcon = (p) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
const BackIcon = (p) => <Icon {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></Icon>;
const CheckIcon = (p) => <Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>;
const PlayIcon = (p) => <Icon {...p}><polygon points="6 4 20 12 6 20 6 4"/></Icon>;
const HomeIcon = (p) => <Icon {...p}><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></Icon>;
const ChefIcon = (p) => <Icon {...p}><path d="M6 14h12v5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M6 14a4 4 0 1 1 1.5-7.7A4 4 0 0 1 12 4a4 4 0 0 1 4.5 2.3A4 4 0 1 1 18 14"/></Icon>;
const UserIcon = (p) => <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>;
const MoreIcon = (p) => <Icon {...p}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></Icon>;
const ChevronRight = (p) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>;
const PauseIcon = (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></Icon>;

Object.assign(window, {
  SearchIcon, TimerIcon, BookmarkIcon, HeartIcon, UsersIcon, BackIcon,
  CheckIcon, PlayIcon, PauseIcon, HomeIcon, ChefIcon, UserIcon, MoreIcon,
  ChevronRight
});
