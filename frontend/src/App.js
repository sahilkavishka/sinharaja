import React, { useState, useEffect, useRef, useCallback } from "react";
// eslint-disable-next-line no-unused-vars
import { SinharajaEngine } from "./SinharajaEngine";
import { Sinharaja3DEngine } from "./Sinharaja3DEngine";
import { I18N } from "./i18n";
import "./App.css";

// ── Sharp Monochrome Vector SVG Icons for Tactical HUD ────────────────────────
export const Icons = {
  Heart: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  ),
  Cross: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
    </svg>
  ),
  Stamina: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
    </svg>
  ),
  Battery: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z"/>
    </svg>
  ),
  Torch: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M6 2h12v3l-2 3v14H8V8L6 5V2zm4 8v10h4V10l1.5-2.25L16 4H8l.5 3.75L10 10z"/>
    </svg>
  ),
  Salt: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M7 3h10v2H7V3zm1 3h8l1 4H7l1-4zm-2 5h12l1 11H5L6 11zm3 3v2h2v-2H9zm4 0v2h2v-2h-2zm-2 3v2h2v-2h-2z"/>
    </svg>
  ),
  Herb: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25V9c2.45-.41 5.31-.76 8-1z"/>
    </svg>
  ),
  Balm: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M10 2h4v2h-4V2zm-2 3h8v2H8V5zm-2 3h12a1 1 0 011 1v11a2 2 0 01-2 2H7a2 2 0 01-2-2V9a1 1 0 011-1zm3 3v7h6v-7H9z"/>
    </svg>
  ),
  Tea: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
    </svg>
  ),
  GingerTea: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M3 13h14v2a4 4 0 01-4 4H7a4 4 0 01-4-4v-2zm16-4h-2V7h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-2h2V9zM2 21h18v2H2zM9 2c.55 0 1 .45 1 1 0 1.5-1 2-1 3.5 0 .55-.45 1-1 1s-1-.45-1-1C7 5 8 4.5 8 3c0-.55.45-1 1-1zm4 0c.55 0 1 .45 1 1 0 1.5-1 2-1 3.5 0 .55-.45 1-1 1s-1-.45-1-1c0-1.5 1-2 1-3.5 0-.55.45-1 1-1z"/>
    </svg>
  ),
  Camera: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  ),
  Crosshair: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M11 2v2.07c-3.95.49-7 3.85-7.43 7.93H1.5v2h2.07c.43 4.08 3.48 7.44 7.43 7.93V24h2v-2.07c3.95-.49 7-3.85 7.43-7.93h2.07v-2h-2.07c-.43-4.08-3.48-7.44-7.43-7.93V2h-2zm1 4c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zm0 4a2 2 0 100 4 2 2 0 000-4z"/>
    </svg>
  ),
  UV: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7zm-3 18h6v1c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-1zm4-12.87V13h-2V7.13C9.82 7.55 9 8.68 9 10c0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.32-.82-2.45-2-2.87z"/>
    </svg>
  ),
  EMF: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M4 6h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zm0 3v8h16V9H4zm3 2h3v4H7v-4zm5 1h5v2h-5v-2zM15 2l-3.5 4h2L17 2h-2z"/>
    </svg>
  ),
  Inspect: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  ),
  Zoom: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  ),
  Evidence: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
  ),
  Map: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
    </svg>
  ),
  Backpack: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M17 4.14V2h-4v2.14C8.98 4.7 6 8.01 6 12v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-8c0-3.99-2.98-7.3-7-7.86zM11 4h2v1h-2V4zm5 16H8v-6h8v6zm0-8H8c0-2.21 1.79-4 4-4s4 1.79 4 4z"/>
    </svg>
  ),
  Trophy: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
    </svg>
  ),
  Journal: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4zm12 16H6v-1.5c0-.28.22-.5.5-.5H18v2z"/>
    </svg>
  ),
  AudioOn: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
  ),
  AudioMute: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>
  ),
  Eye: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  ),
  Pause: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  ),
  Radio: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 17c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-5h-8V9h8v3z"/>
    </svg>
  ),
  Disk: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
    </svg>
  ),
  Check: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  ),
  Lock: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  ),
  Settings: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  ),
  Target: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
  ),
  Shield: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
    </svg>
  ),
  Thermometer: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1h-2z"/>
    </svg>
  ),
  Book: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
    </svg>
  ),
  Key: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
  ),
  Vial: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M6 3v2h1v11a4 4 0 004 4h2a4 4 0 004-4V5h1V3H6zm9 13a2 2 0 01-2 2h-2a2 2 0 01-2-2V9h6v7z"/>
    </svg>
  ),
  Tape: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-14 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm12 0c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm-6-2h-4V9h4v2z"/>
    </svg>
  ),
  Crystal: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2L5 8l7 14 7-14-7-14zm0 3.3L16.4 8H7.6L12 5.3zM7.1 9.5h9.8L12 19.3 7.1 9.5z"/>
    </svg>
  ),
  Scroll: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19 3H7c-1.66 0-3 1.34-3 3v13c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3zm-1 16H7c-.55 0-1-.45-1-1s.45-1 1-1h11v2zm2-4H6V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v9z"/>
    </svg>
  ),
  Lantern: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M9 2h6v2H9V2zm-2 5l2-2h6l2 2v9l-3 4H10l-3-4V7zm3 1v7h4V8h-4z"/>
    </svg>
  ),
  Orb: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z"/>
    </svg>
  ),
  Folder: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  ),
  Keycard: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2zM6 15h4v2H6v-2z"/>
    </svg>
  ),
  Dna: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M18.8 3.2L17.4 1.8 14.5 4.7C13 3.6 11 3.6 9.5 4.7L6.6 1.8 5.2 3.2l2.9 2.9C7 7.6 7 9.6 8.1 11.1L3.2 16l1.4 1.4 4.9-4.9c1.5 1.1 3.5 1.1 5 0l4.9 4.9 1.4-1.4-4.9-4.9c1.1-1.5 1.1-3.5 0-5l2.9-2.9zM12 13.4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
  ),
  Box: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 2h5v3H7V5h5zm-7 5h14v9H5v-9z"/>
    </svg>
  ),
  Satellite: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/>
    </svg>
  ),
  Feather: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M21 3c-4.5 0-9.5 2.5-12.5 7.5L5 16l-3 5 5-3 5.5-3.5C17.5 11.5 21 6.5 21 3zm-7.8 9.2l-2.4 2.4-1.4-1.4 2.4-2.4 1.4 1.4z"/>
    </svg>
  ),
  WaterDrop: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
    </svg>
  ),
  Flame: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.61 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM12 20c-3.31 0-6-2.69-6-6 0-1.53.5-3.04 1.43-4.28.32 1.94 1.96 3.48 4.07 3.48 2.21 0 4-1.79 4-4 0-.41-.07-.8-.2-1.16C16.84 9.57 18 11.66 18 14c0 3.31-2.69 6-6 6z"/>
    </svg>
  ),
  Warning: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  ),
  Gear: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  ),
  Bolt: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
    </svg>
  ),
  Helicopter: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2v2H3v2h9v2H7a4 4 0 00-4 4v2h2v4H3v2h12v-2h-2v-4h4l4 3h3v-2l-3-3V9h-3V6h6V4h-9V2h-1zm-3 8h6v4H9v-4z"/>
    </svg>
  ),
  Tower: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2l-4 18h2.5l1-5h1l1 5H16L12 2zm0 4.5l1.5 6.5h-3L12 6.5zM11 20h2v2h-2z"/>
    </svg>
  ),
  Unlock: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>
    </svg>
  ),
  Pin: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M16 9V4l1 0V2H7v2l1 0v5c0 1.66-1.34 3-3 3v2h5.97v7l1.03 1 1.03-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
    </svg>
  ),
  Search: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  ),
  Restart: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg>
  ),
  Crank: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
    </svg>
  ),
  Skull: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2C7.58 2 4 5.58 4 10c0 2.65 1.3 4.99 3.29 6.42.23.16.4.39.48.66l.73 2.42c.15.5.61.85 1.14.85h4.72c.53 0 .99-.35 1.14-.85l.73-2.42c.08-.27.25-.5.48-.66C18.7 14.99 20 12.65 20 10c0-4.42-3.58-8-8-8zm-3 9c-.83 0-1.5-.67-1.5-1.5S8.17 8 9 8s1.5.67 1.5 1.5S9.83 11 9 11zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 8 15 8s1.5.67 1.5 1.5S15.83 11 15 11z"/>
    </svg>
  ),
  Volume: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M3 9v6h4l5 5V4L7 9H3zm10.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
    </svg>
  ),
  Exit: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
    </svg>
  ),
  Clock: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
    </svg>
  ),
  Brain: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 3a4.5 4.5 0 00-4.5 4.5c0 .34.04.67.11.99A4.5 4.5 0 004 12.5a4.5 4.5 0 003.5 4.4v.1a4.5 4.5 0 004.5 4.5 4.5 4.5 0 004.5-4.5v-.1a4.5 4.5 0 003.5-4.4 4.5 4.5 0 00-3.61-4.01c.07-.32.11-.65.11-.99A4.5 4.5 0 0012 3z"/>
    </svg>
  ),
  Keyboard: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
    </svg>
  ),
  Snowflake: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM11 11.5v-3h2v3h2.5l-3.5 3.5-3.5-3.5H11z"/>
    </svg>
  ),
  Mask: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/>
    </svg>
  ),
  Siren: (props) => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
      <path d="M12 2a6 6 0 00-6 6v3L4 14v2h16v-2l-2-3V8a6 6 0 00-6-6zm0 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
    </svg>
  )
};

// ── Master Achievements Data ────────────────────────────────────────────────
const MASTER_ACHIEVEMENTS = [
  {
    id: "spring_water",
    nameSinhala: "ස්වභාවික පැන්",
    nameEnglish: "Pure Spring",
    desc: "ස්වභාවික ජල උල්පතකින් පිපාසය නිවාගන්නා ලදී.",
    icon: "WaterDrop",
  },
  {
    id: "tea_master",
    nameSinhala: "සුවදායක ඔසුපැන්",
    nameEnglish: "Herbalist",
    desc: "ගිනිමැලය අසල සිංහරාජ දුර්ලභ පැළෑටිවලින් ඔසුපැන් පෙරන ලදී.",
    icon: "Tea",
  },
  {
    id: "viper_repelled",
    nameSinhala: "පළා පොළඟා මෙල්ලකරු",
    nameEnglish: "Snake Charmer",
    desc: "විෂඝෝර පළා පොළඟා පසුකර ආරක්ෂිතව ගමන් කරන ලදී.",
    icon: "Warning",
  },
  {
    id: "magpie_feather",
    nameSinhala: "කැහිබෙලි පිහාටුව",
    nameEnglish: "Magpie Seeker",
    desc: "දුර්ලභ සිංහරාජ කැහිබෙල්ලාගේ නිල් පිහාටුවක් සොයාගන්නා ලදී.",
    icon: "Feather",
  },
  {
    id: "raft_master",
    nameSinhala: "පහුරු නාවිකයා",
    nameEnglish: "Raft Navigator",
    desc: "උණ බම්බු පහුර පදවා මහා දියඇලි අගාධය සාර්ථකව තරණය කරන ලදී.",
    icon: "Target",
  },
  {
    id: "legend_ch1",
    nameSinhala: "කුඩව පුරාවෘත්තය",
    nameEnglish: "Hero of Kudawa",
    desc: "Chapter 01 හි සියලු සාක්ෂි එකතු කර හෙලිපෑඩ් වෙත ළඟා විය.",
    icon: "Trophy",
  },
  {
    id: "legend_ch2",
    nameSinhala: "දියඇලි ජයග්‍රාහකයා",
    nameEnglish: "Cascades Conqueror",
    desc: "Chapter 02 හි සියලු සාක්ෂි එකතු කර සංඥා කුලුන දල්වන ලදී.",
    icon: "Tower",
  },
  {
    id: "cable_mechanic",
    nameSinhala: "කේබල් කාර්මිකයා",
    nameEnglish: "Cableway Mechanic",
    desc: "ගියර් සවි කර කැඩුණු කේබල් කරත්තය අලුත්වැඩියා කර අගාධය තරණය කිරීම.",
    icon: "Gear",
  },
  {
    id: "frost_ward",
    nameSinhala: "ශීතලෙන් මිදීම",
    nameEnglish: "Frost Ward",
    desc: "අධික මීදුම සහ ශීතල මධ්‍යයේ උණුසුම් ඉඟුරු තේ සහ ගිනිමැල භාවිතයෙන් දිවි ගලවා ගැනීම.",
    icon: "Snowflake",
  },
  {
    id: "leech_balm",
    nameSinhala: "කූඩැලි ප්‍රතිරෝධය",
    nameEnglish: "Leech Ward",
    desc: "කූඩැලි විකර්ෂක වන තෙල් ආලේප කරන ලදී.",
    icon: "Balm",
  },
  {
    id: "wildlife_photographer",
    nameSinhala: "වනජීවී ඡායාරූප ශිල්පියා",
    nameEnglish: "Wildlife Photographer",
    desc: "සිංහරාජයේ දුර්ලභ සතෙකුගේ සුපැහැදිලි ඡායාරූපයක් ගන්නා ලදී.",
    icon: "Camera",
  },
  {
    id: "uv_detective",
    nameSinhala: "පාරජම්බුල රහස් පරීක්ෂක",
    nameEnglish: "UV Investigator",
    desc: "1987 අතුරුදහන් ගවේෂකයන්ගේ දිදුලන පා සටහන් සහ රහස් සංකේත සොයාගැනීම.",
    icon: "UV",
  },
  {
    id: "flare_evac",
    nameSinhala: "ගලවාගැනීමේ සංඥාව",
    nameEnglish: "Rescue Beacon",
    desc: "හෙලිපෑඩ් මතින් හදිසි රතු සංඥා වෙඩිල්ල දල්වා හෙලිකොප්ටරය කැඳවීම.",
    icon: "Siren",
  },
  {
    id: "magpie_charm",
    nameSinhala: "කැහිබෙලි ආමුදිතය",
    nameEnglish: "Lucky Magpie Charm",
    desc: "කැහිබෙල්ලාගේ නිල් පිහාටු 3ම එකතු කර වේගය සහ ශක්තිය වැඩිකර ගැනීම.",
    icon: "Feather",
  },
  {
    id: "crystal_spring",
    nameSinhala: "සිසිල් උල්පත",
    nameEnglish: "Crystal Spring",
    desc: "කඳුකර පිරිසිදු උල්පතෙන් පැන් පානය කර ප්‍රබෝධමත් වීම.",
    icon: "WaterDrop",
  },
  {
    id: "master_photographer",
    nameSinhala: "වනජීවී විශාරද සම්මානය",
    nameEnglish: "Golden Wildlife Master",
    desc: "සිංහරාජයේ ආවේණික සතුන් 4 දෙනාගේම ඡායාරූප සම්පූර්ණ කිරීම.",
    icon: "Trophy",
  },
];

// ── Chapters Data ─────────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: 1,
    title: "CHAPTER 01",
    nameSinhala: "කුඩව අඳුරු මාවත",
    nameEnglish: "The Kudawa Trailhead",
    tagline: "අතුරුදහන් වූ ගවේෂකයන්ගේ ආරම්භක හෝඩුවාවන් සෙවීම",
    desc: "කූඩැල්ලන් පිරි මඩ වගුර සහ ගංගා නිම්නය තරණය කර අතහැර දැමූ මුරපොළේ දිනපොත සහ භූගත ලෙනේ සාම්පල සොයාගෙන හෙලිපෑඩ් වෙත ළඟා වන්න.",
    image: "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1200",
    climate: "STORM // MIDNIGHT PROTOCOL",
    evidenceList: [
      { id: "diary", name: "ලෙයින් පෙඟුණු දිනපොත", icon: "Book" },
      { id: "key", name: "පුරාණ පිත්තල යතුර", icon: "Key" },
      { id: "sample", name: "පර්යේෂණ සාම්පලය", icon: "Vial" },
    ],
  },
  {
    id: 2,
    title: "CHAPTER 02",
    nameSinhala: "මීදුම් නිම්නය සහ මහා දියඇලි",
    nameEnglish: "The Mist Gorge & Cascades",
    tagline: "අධික ශීතල, ඝන මීදුම සහ කැඩුණු කේබල් කරත්තයේ අභිරහස",
    desc: "ශීතලෙන් මිදී (Body Warmth) උණ බම්බු පහුර සහ කේබල් කරත්තය (Cable Trolley) අලුත්වැඩියා කර, පැරණි භූවිද්‍යා කඳවුරේ සිතියම, හඬපටය සහ නිල් ස්ඵටිකය සොයාගෙන සංඥා කුලුන දල්වන්න.",
    image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=1200",
    climate: "HEAVY MIST // CRYOGENIC GORGE",
    reqMsg: "Chapter 01 අවසන් කර සාක්ෂි එකතු කිරීමෙන් පසු විවෘත වේ.",
    evidenceList: [
      { id: "map2", name: "භූවිද්‍යා සිතියම", icon: "Map" },
      { id: "tape", name: "පටිගත කළ හඬපටය", icon: "Tape" },
      { id: "gem", name: "නිල් ස්ඵටික සාම්පලය", icon: "Crystal" },
    ],
  },
  {
    id: 3,
    title: "CHAPTER 03",
    nameSinhala: "යක්ෂ ගිරි භූගත අගාධය",
    nameEnglish: "The Subterranean Caverns",
    tagline: "පොළොව යට සැඟවුණු ප්‍රාග් ඓතිහාසික ලෙන් සංකීර්ණය",
    desc: "භූගත අන්ධකාරයේ වෙසෙන අද්භූත සතුන් සහ පැරණි ශිලා ලේඛන මැදින් භූගත ගංගාව තරණය කර 1987 රහස් ලෙන සොයා යන්න.",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200",
    climate: "SUBTERRANEAN // BIOLUMINESCENT",
    reqMsg: "Chapter 02 සාර්ථකව නිම කරන්න.",
    evidenceList: [
      { id: "ch3_slate", name: "ශිලා ලේඛන පිටපත", icon: "Scroll" },
      { id: "ch3_torch", name: "පුරාණ තෙල් පහන", icon: "Lantern" },
      { id: "ch3_core", name: "ප්‍රතිදීප්ත පාෂාණය", icon: "Orb" },
    ],
  },
  {
    id: 4,
    title: "CHAPTER 04",
    nameSinhala: "නටබුන් වූ රහස් පර්යේෂණාගාරය",
    nameEnglish: "The Forgotten Facility",
    tagline: "අතහැර දැමූ 1987 රසායනාගාරය සහ අමුතු සංඥා",
    desc: "ගස් මුල්වලින් වැසුණු රහස් පර්යේෂණ කඳවුරේ ජෙනරේටර් පණගන්වා, අගුළු දැමූ විද්‍යාගාරයේ රහස් ලිපිගොනු සහ DNA සාම්පල සොයාගන්න.",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200",
    climate: "COMPLEX 87 // INDUSTRIAL BLACKOUT",
    reqMsg: "Chapter 03 සාර්ථකව නිම කරන්න.",
    evidenceList: [
      { id: "ch4_docs", name: "රහස් ලිපිගොනුව", icon: "Folder" },
      { id: "ch4_keycard", name: "ප්‍රවේශ කාඩ්පත", icon: "Keycard" },
      { id: "ch4_sample", name: "විකෘති DNA සාම්පලය", icon: "Dna" },
    ],
  },
  {
    id: 5,
    title: "CHAPTER 05",
    nameSinhala: "මහා නාවෘක්ෂය සහ අවසාන සත්‍යය",
    nameEnglish: "The Colossus Canopy & Final Truth",
    tagline: "වලාකුළු මට්ටමේ මහා ගස් වියන සහ අවසාන හෙළිදරව්ව",
    desc: "අඩි 150ක් උසින් පිහිටි යෝධ නාවෘක්ෂ වියන් පාලම (Canopy Walkway) මතින් නැගී, 1987 අතුරුදහන් වීමේ සම්පූර්ණ සත්‍යය හෙළිකර අවසාන ගලවාගැනීමේ යානය අමතන්න.",
    image: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1200",
    climate: "STRATOSPHERE // GOLDEN CANOPY",
    reqMsg: "සියලු පරිච්ඡේදවල සාක්ෂි එකතු කිරීමෙන් පසු විවෘත වේ.",
    evidenceList: [
      { id: "ch5_blackbox", name: "ගවේෂණ කළු පෙට්ටිය", icon: "Box" },
      { id: "ch5_beacon", name: "අවසාන සංඥා උපකරණය", icon: "Satellite" },
      { id: "ch5_truth", name: "මහාචාර්ය ඩග්ලස්ගේ සටහන", icon: "Scroll" },
    ],
  },
];

const CHAPTER_LOCATIONS = {
  1: { label: "KUDAWA TRAIL // MIDNIGHT PROTOCOL", coords: "LAT 6.40°N | LON 80.45°E | RAIN" },
  2: { label: "MIST GORGE // DAYLIGHT", coords: "ELEV 850m | 08:30 AM | 8°C" },
  3: { label: "DEEP CAVERNS // BIOLUMINESCENT", coords: "DEPTH -140m | AIR HAZARD" },
  4: { label: "COMPLEX 87 // BUNKER FACILITY", coords: "SECTOR B | 380V DANGER" },
  5: { label: "COLOSSUS CANOPY // GOLDEN DUSK", coords: "ALT 120m | WIND 28kt | FINAL" }
};

// ── Dial Puzzle Options ───────────────────────────────────────────────────
const DIAL_1_OPTIONS = ["[I] MOON (සඳ)", "[II] SUN (සූර්යයා)", "[III] STAR (තාරකාව)", "[IV] FIRE (ගින්න)"];
const DIAL_2_OPTIONS = ["[I] MOUNTAIN (කන්ද)", "[II] RIVER (ගංගාව)", "[III] FOREST (වෘක්ෂය)", "[IV] WIND (සුළඟ)"];
const DIAL_3_OPTIONS = ["[I] ELEPHANT (හස්තියා)", "[II] LION (සිංහයා)", "[III] EAGLE (පක්ෂියා)", "[IV] SERPENT (සර්පයා)"];

const SAVE_KEY = "sinharaja_save_v2";

export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // Persistence State - Strict Sequential Progression (1 -> 2 -> 3 -> 4 -> 5)
  const [completedChapters, setCompletedChapters] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.completedChapters && Array.isArray(parsed.completedChapters)) {
          return parsed.completedChapters;
        }
      }
    } catch (e) {}
    return [];
  });

  const [unlockedChapters, setUnlockedChapters] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const unlocked = new Set([1]);
        if (parsed.completedChapters && Array.isArray(parsed.completedChapters)) {
          parsed.completedChapters.forEach((c) => {
            unlocked.add(c);
            if (c + 1 <= 5) unlocked.add(c + 1);
          });
        }
        return Array.from(unlocked).sort((a, b) => a - b);
      }
    } catch (e) {}
    return [1]; // Only Chapter 1 unlocked initially
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.achievements) return parsed.achievements;
      }
    } catch (e) {}
    return [];
  });

  // App Navigation States
  const [currentView, setCurrentView] = useState("chapters"); // 'chapters' | 'playing'
  const [activeChapter, setActiveChapter] = useState(1);
  const [gameOver, setGameOver] = useState(null); // 'dead' | 'insane' | 'won'
  const [victoryType, setVictoryType] = useState("survivor");
  const [isPaused, setIsPaused] = useState(false);
  const [showControlsGuide, setShowControlsGuide] = useState(false);
  const [showTrophies, setShowTrophies] = useState(false);

  // Settings & Localization State
  const [isMuted, setIsMuted] = useState(false);
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("sinharaja_lang") || "si";
    } catch (e) {
      return "si";
    }
  });
  const [controlScheme, setControlScheme] = useState(() => {
    try {
      return localStorage.getItem("sinharaja_controls") || "joystick";
    } catch (e) {
      return "joystick";
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== "undefined" && !!document.fullscreenElement);

  // Virtual Analog Joystick State
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0, active: false });
  const joystickTouchIdRef = useRef(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });

  const toggleLanguage = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "si" : "en";
      try {
        localStorage.setItem("sinharaja_lang", next);
      } catch (e) {}
      if (engineRef.current && engineRef.current.setLang) {
        engineRef.current.setLang(next);
      }
      return next;
    });
  }, []);

  const toggleControlScheme = useCallback(() => {
    setControlScheme((prev) => {
      const next = prev === "joystick" ? "dpad" : "joystick";
      try {
        localStorage.setItem("sinharaja_controls", next);
      } catch (e) {}
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // UI Panels
  const [showEvidenceBoard, setShowEvidenceBoard] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [journalTab, setJournalTab] = useState("guide"); // 'guide' | 'photos'
  const [showTacticalMap, setShowTacticalMap] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [inspectDiaryOpen, setInspectDiaryOpen] = useState(false);
  const [inspectTapeOpen, setInspectTapeOpen] = useState(false);
  const [inspectDouglasTapeOpen, setInspectDouglasTapeOpen] = useState(false);
  const [radioTransmission, setRadioTransmission] = useState(null);
  const [showDebriefing, setShowDebriefing] = useState(false);
  const [dialogue, setDialogue] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [achievementToast, setAchievementToast] = useState(null);
  const [showOnboardingTip, setShowOnboardingTip] = useState(true);
  const [isImmersiveHud, setIsImmersiveHud] = useState(false);
  const [sanityWhisper, setSanityWhisper] = useState("");
  const whisperTimerRef = useRef(0);

  // Wildlife Field Camera Snapshots State
  const [capturedPhotos, setCapturedPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.capturedPhotos && Array.isArray(parsed.capturedPhotos)) {
          return parsed.capturedPhotos;
        }
      }
    } catch (e) {}
    return [];
  });
  const [photoFlash, setPhotoFlash] = useState(false);
  const [photoModal, setPhotoModal] = useState(null);

  // Interactive Rune Puzzle Modal State
  const [runePuzzleOpen, setRunePuzzleOpen] = useState(false);
  const [dial1, setDial1] = useState(0);
  const [dial2, setDial2] = useState(0);
  const [dial3, setDial3] = useState(0);
  const [puzzleError, setPuzzleError] = useState("");
  const unlockCallbackRef = useRef(null);

  // Master Collected Evidence Record
  const [evidence, setEvidence] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.evidence) return parsed.evidence;
      }
    } catch (e) {}
    return {
      map: true,
      diary: false,
      key: false,
      sample: false,
      map2: false,
      tape: false,
      gem: false,
    };
  });

  const [journal, setJournal] = useState([
    {
      title: "කුඩව පිවිසුම (Kudawa Trailhead)",
      desc: "සිංහරාජ ලෝක උරුම වැසි වනාන්තරයේ ප්‍රධාන පිවිසුම් මාවතයි.",
    },
    {
      title: "ශ්‍රී ලංකා කැහිබෙල්ලා (Sri Lanka Blue Magpie)",
      desc: "සිංහරාජයට ආවේණික අලංකාර නිල් පැහැති පක්ෂියෙකි. මොවුන්ගේ නිල් පිහාටු වාසනාව ගෙනදෙන බව පැවසේ.",
    },
    {
      title: "කළු වඳුරා (Purple-faced Langur)",
      desc: "වැසි වනාන්තරයේ වියන් ස්ථරයේ වෙසෙන ශ්‍රී ලංකාවට ආවේණික දුර්ලභ වඳුරු විශේෂයකි.",
    },
  ]);

  // Real-time Stats from Engine
  const [stats, setStats] = useState({
    health: 100,
    sanity: 100,
    battery: 100,
    stamina: 100,
    torchOn: true,
    saltCount: 3,
    herbCount: 1,
    balmCount: 1,
    repellentTimer: 0,
    nearCampfire: false,
    hasKey: false,
    hasSample: false,
    bleeding: false,
    teaBuffTimer: 0,
    uvUnlocked: false,
    uvMode: false,
    stormActive: false,
    feathersCollected: 0,
    magpieCharmActive: false,
    flareGunFound: false,
    flareFired: false,
    elapsedTime: 0,
    inShelter: true,
    inCave: false,
    inMud: false,
    zoom: 1.0,
    playerX: 520,
    playerY: 720,
    attachedLeeches: 0,
    venomToxicity: 0,
    noiseLevel: 14,
    stalkerAlert: false,
    stalkerEyes: false,
    difficulty: "tactical",
    tasks: {
      diaryFound: false,
      keyFound: false,
      sampleFound: false,
      helipadReached: false,
      mapFound: false,
      raftUsed: false,
      tapeFound: false,
      gemFound: false,
      towerReached: false,
    },
  });

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  }, []);

  // Save Progress to LocalStorage
  const saveGame = useCallback(() => {
    try {
      const dataToSave = {
        unlockedChapters,
        completedChapters,
        evidence,
        achievements: unlockedAchievements,
        activeChapter,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn("Autosave failed", e);
    }
  }, [unlockedChapters, completedChapters, evidence, unlockedAchievements, activeChapter]);

  const saveGameRef = useRef(saveGame);
  useEffect(() => {
    saveGameRef.current = saveGame;
  }, [saveGame]);

  // Launch Active Chapter
  const launchChapter = (chapId) => {
    if (!unlockedChapters.includes(chapId)) {
      showToast("[LOCKED] මෙම පරිච්ඡේදය තවමත් අගුළු වැටී ඇත! පෙර පරිච්ඡේදය අවසන් කරන්න.");
      return;
    }
    setActiveChapter(chapId);
    setGameOver(null);
    setIsPaused(false);
    setShowOnboardingTip(true);
    setCurrentView("playing");

    if (chapId === 2) {
      setDialogue({
        title: "CHAPTER 02: නිහඬ දියඇලි නිම්නය",
        speaker: "EXPEDITION HQ",
        avatar: "Radio",
        text: "දෙවන කලාපය: දියඇලි ජල කඳ තරණය කිරීමට උණ බම්බු පහුර සොයාගන්න. අතුරුදහන් වූ භූවිද්‍යා කඳවුරේ සිතියම, පටිගත කළ හඬපටය සහ නිල් ස්ඵටිකය සොයාගෙන කඳු මුදුනේ සංඥා කුලුන දල්වන්න!",
      });
    } else if (chapId === 3) {
      setDialogue({
        title: "CHAPTER 03: යක්ෂ ගිරි භූගත අගාධය",
        speaker: "EXPEDITION HQ",
        avatar: "Radio",
        text: "තුන්වන කලාපය: ගැඹුරු හුණුගල් ලෙන් අගාධය! විෂ සල්ෆර් වායුවෙන් ආරක්ෂා වීමට Gas Mask එක පළඳින්න. ජල සොරොව්ව හරවා ප්‍රතිදීප්ත අගාධ පාෂාණය සහ පතල් වාර්තා ලබාගෙන භූගත ලිෆ්ට් එකෙන් පිටවන්න!",
      });
    } else if (chapId === 4) {
      setDialogue({
        title: "CHAPTER 04: නටබුන් වූ රහස් පර්යේෂණාගාරය",
        speaker: "EXPEDITION HQ",
        avatar: "Radio",
        text: "හතරවන කලාපය: 1987 රහස් බංකරය! ප්‍රධාන ඩීසල් ජෙනරේටරය පණගන්වා, විදුලි තටාකයේ බ්‍රේකර් විසන්ධි කර, Level 3 Keycard ලබාගෙන ක්‍රයෝ-කුටියේ විකෘති DNA සාම්පලය සමඟ වියන් මොනොරේල් එක වෙත යන්න!",
      });
    } else if (chapId === 5) {
      setDialogue({
        title: "CHAPTER 05: මහා නාවෘක්ෂය සහ අවසාන සත්‍යය",
        speaker: "EXPEDITION HQ",
        avatar: "Radio",
        text: "අවසාන කලාපය: අඩි 150ක් උසින් පිහිටි වලාකුළු වියන් පාලම! හෙලිකොප්ටර් කළු පෙට්ටිය, මහාචාර්ය ඩග්ලස්ගේ අවසාන සටහන සොයාගෙන සැටලයිට් ඇන්ටනාව ඔස්සේ සත්‍යය ලොවට මුදාහැර ගලවාගැනීමේ සංඥාව දල්වන්න!",
      });
    } else {
      setDialogue({
        title: "CHAPTER 01: කුඩව අඳුරු මාවත",
        speaker: "EXPEDITION HQ",
        avatar: "Radio",
        text: "ඔබේ ප්‍රධාන ඉලක්කය: අතුරුදහන් වූ ගවේෂකයන්ගේ සාක්ෂි 3ම (දිනපොත, පිත්තල යතුර, පර්යේෂණ සාම්පලය) සොයාගෙන කඳු මුදුනේ ඇති හෙලිපෑඩ් වෙත ළඟා වන්න!",
      });
    }
  };

  // Toggle Pause
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (engineRef.current) engineRef.current.paused = next;
      return next;
    });
  }, []);

  // Initialize Canvas when playing starts
  useEffect(() => {
    if (currentView !== "playing" || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Instantiate genuine 3D WebGL renderer for true First-Person I.G.I. exploration
    const engine = new Sinharaja3DEngine(canvas, {
      chapter: activeChapter,
      lang,
      onStatsUpdate: (newStats) => {
        setStats(newStats);
        if (activeChapter === 1) {
          setEvidence((prev) => {
            const diary = prev.diary || Boolean(newStats.tasks && newStats.tasks.diaryFound);
            const key = prev.key || Boolean(newStats.tasks && newStats.tasks.keyFound);
            const sample = prev.sample || Boolean(newStats.tasks && newStats.tasks.sampleFound);
            if (diary === prev.diary && key === prev.key && sample === prev.sample) {
              return prev;
            }
            return { ...prev, diary, key, sample };
          });
        } else if (activeChapter === 2) {
          setEvidence((prev) => {
            const map2 = prev.map2 || Boolean(newStats.tasks && newStats.tasks.mapFound);
            const tape = prev.tape || Boolean(newStats.tasks && newStats.tasks.tapeFound);
            const gem = prev.gem || Boolean(newStats.tasks && newStats.tasks.gemFound);
            if (map2 === prev.map2 && tape === prev.tape && gem === prev.gem) {
              return prev;
            }
            return { ...prev, map2, tape, gem };
          });
        } else if (activeChapter === 3) {
          setEvidence((prev) => {
            const ch3_slate = prev.ch3_slate || Boolean(newStats.tasks && newStats.tasks.slateFound);
            const ch3_core = prev.ch3_core || Boolean(newStats.tasks && newStats.tasks.coreFound);
            const ch3_torch = prev.ch3_torch || Boolean(newStats.tasks && newStats.tasks.logFound);
            if (ch3_slate === prev.ch3_slate && ch3_core === prev.ch3_core && ch3_torch === prev.ch3_torch) {
              return prev;
            }
            return { ...prev, ch3_slate, ch3_core, ch3_torch };
          });
        } else if (activeChapter === 4) {
          setEvidence((prev) => {
            const ch4_docs = prev.ch4_docs || Boolean(newStats.tasks && newStats.tasks.docsFound);
            const ch4_keycard = prev.ch4_keycard || Boolean(newStats.tasks && newStats.tasks.keycardFound);
            const ch4_sample = prev.ch4_sample || Boolean(newStats.tasks && newStats.tasks.dnaFound);
            if (ch4_docs === prev.ch4_docs && ch4_keycard === prev.ch4_keycard && ch4_sample === prev.ch4_sample) {
              return prev;
            }
            return { ...prev, ch4_docs, ch4_keycard, ch4_sample };
          });
        } else if (activeChapter === 5) {
          setEvidence((prev) => {
            const ch5_blackbox = prev.ch5_blackbox || Boolean(newStats.tasks && newStats.tasks.blackboxFound);
            const ch5_truth = prev.ch5_truth || Boolean(newStats.tasks && newStats.tasks.truthFound);
            const ch5_beacon = prev.ch5_beacon || Boolean(newStats.tasks && newStats.tasks.beaconActivated);
            if (ch5_blackbox === prev.ch5_blackbox && ch5_truth === prev.ch5_truth && ch5_beacon === prev.ch5_beacon) {
              return prev;
            }
            return { ...prev, ch5_blackbox, ch5_truth, ch5_beacon };
          });
        }

        if (newStats.sanity < 36) {
          const now = Date.now();
          if (now - whisperTimerRef.current > 7000) {
            whisperTimerRef.current = now;
            const whispers = [
              "ඔවුන් අඳුරේ බලා සිටියි...",
              "අඩි ශබ්දයක් ඇසුණා...",
              "පිටුපස බලන්න එපා...",
              "ඔබ මෙහි තනිවී නැත...",
              "කැලය ඔබට කතා කරයි...",
              "සෙවණැලි චලනය වේ..."
            ];
            setSanityWhisper(whispers[Math.floor(Math.random() * whispers.length)]);
            setTimeout(() => setSanityWhisper(""), 3500);
          }
        }
      },
      onToggleHud: () => {
        setIsImmersiveHud((prev) => !prev);
      },
      onTogglePause: () => {
        togglePause();
      },
      onToggleMap: () => {
        setShowTacticalMap((prev) => {
          if (engineRef.current) {
            engineRef.current.playSfx(prev ? "pda_close" : "pda_open");
          }
          return !prev;
        });
      },
      onToggleInventory: () => {
        setShowInventory((prev) => {
          if (engineRef.current) {
            engineRef.current.playSfx(prev ? "pda_close" : "pda_open");
          }
          return !prev;
        });
      },
      onToggleEvidence: () => {
        setShowEvidenceBoard((prev) => !prev);
      },
      onOpenRunePuzzle: (unlockCallback) => {
        unlockCallbackRef.current = unlockCallback;
        setRunePuzzleOpen(true);
      },
      onOpenDouglasTape: () => {
        setInspectDouglasTapeOpen(true);
      },
      onRadioTransmission: (data) => {
        setRadioTransmission(data);
        setTimeout(() => {
          setRadioTransmission((cur) => (cur?.id === data.id ? null : cur));
        }, 7500);
      },
      onTriggerStory: (story) => {
        setDialogue(story);
        if (story.lore) {
          setJournal((prev) => {
            if (prev.some((j) => j.title === story.lore.title)) return prev;
            return [...prev, story.lore];
          });
        }
      },
      onNotify: (msg) => {
        showToast(msg);
      },
      onPhotoCaptured: (photo) => {
        setCapturedPhotos((prev) => {
          if (prev.some((p) => p.id === photo.id)) return prev;
          const updated = [...prev, photo];
          if (saveGameRef.current) {
            setTimeout(() => saveGameRef.current(), 100);
          }
          return updated;
        });
        setPhotoFlash(true);
        setTimeout(() => setPhotoFlash(false), 250);
        setPhotoModal(photo);
      },
      onAchievementUnlocked: (id, name, icon) => {
        setUnlockedAchievements((prev) => {
          if (prev.includes(id)) return prev;
          const next = [...prev, id];
          setAchievementToast({ id, name, icon });
          setTimeout(() => setAchievementToast(null), 4500);
          return next;
        });
        if (saveGameRef.current) saveGameRef.current();
      },
      onAutosave: () => {
        if (saveGameRef.current) saveGameRef.current();
      },
      onGameOver: (type) => {
        setGameOver(type);
      },
      onGameWon: (type) => {
        setVictoryType(type);
        setCompletedChapters((prev) => Array.from(new Set([...prev, activeChapter])));
        if (activeChapter === 1) {
          setUnlockedChapters((prev) => Array.from(new Set([...prev, 2])));
          if (type === "hero") {
            setUnlockedAchievements((prev) => Array.from(new Set([...prev, "legend_ch1"])));
            setShowDebriefing(true);
            if (saveGameRef.current) saveGameRef.current();
            return;
          }
        } else if (activeChapter === 2) {
          setUnlockedChapters((prev) => Array.from(new Set([...prev, 3])));
          if (type === "hero") {
            setUnlockedAchievements((prev) => Array.from(new Set([...prev, "legend_ch2"])));
          }
        } else if (activeChapter === 3) {
          setUnlockedChapters((prev) => Array.from(new Set([...prev, 4])));
        } else if (activeChapter === 4) {
          setUnlockedChapters((prev) => Array.from(new Set([...prev, 5])));
        }
        setGameOver("won");
        if (saveGameRef.current) saveGameRef.current();
      },
    });

    engineRef.current = engine;
    if (isMuted) engine.setMuted(true);

    return () => {
      window.removeEventListener("resize", handleResize);
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, activeChapter, gameOver, showToast, togglePause]);

  // Synchronize audio mute state smoothly without restarting engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMuted(isMuted);
    }
  }, [isMuted]);

  // Audio Mute Toggle
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.setMuted(next);
      }
      return next;
    });
  };

  // 360° Mobile Virtual Analog Joystick Event Handlers
  const handleJoystickStart = (e) => {
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    joystickCenterRef.current = { x: centerX, y: centerY };

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: knobX, y: knobY, active: true });
    if (engineRef.current) {
      engineRef.current.setAnalogMove(knobX / maxRadius, knobY / maxRadius, true);
    }
  };

  const handleJoystickMove = (e) => {
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const { x: centerX, y: centerY } = joystickCenterRef.current;
        const dx = touch.clientX - centerX;
        const dy = touch.clientY - centerY;
        const dist = Math.hypot(dx, dy);
        const maxRadius = 45;
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);
        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        setJoystickPos({ x: knobX, y: knobY, active: true });
        if (engineRef.current) {
          engineRef.current.setAnalogMove(knobX / maxRadius, knobY / maxRadius, true);
        }
        break;
      }
    }
  };

  const handleJoystickEnd = (e) => {
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setJoystickPos({ x: 0, y: 0, active: false });
        if (engineRef.current) {
          engineRef.current.setAnalogMove(0, 0, false);
        }
        break;
      }
    }
  };

  // Touch Virtual Controls
  const handleVirtualDir = (key, isDown) => {
    if (engineRef.current) engineRef.current.keys[key] = isDown;
  };

  const handleVirtualAction = (action) => {
    if (!engineRef.current) return;
    if (action === "salt") engineRef.current.throwSalt();
    if (action === "herb") engineRef.current.useHerb();
    if (action === "tea") engineRef.current.brewHerbalTea();
    if (action === "balm") engineRef.current.useBalm();
    if (action === "camera") engineRef.current.takePhoto();
    if (action === "interact") engineRef.current.interactNearest();
    if (action === "zoom") {
      engineRef.current.targetZoom = engineRef.current.targetZoom === 1.0 ? 0.75 : 1.0;
      showToast(engineRef.current.targetZoom < 1.0 ? "[ZOOM] දුරදක්නය: පුළුල් දර්ශනය (0.75x)" : "[ZOOM] සාමාන්‍ය දර්ශනය (1.0x)");
    }
    if (action === "torch") {
      if (engineRef.current.toggleTorch) {
        engineRef.current.toggleTorch();
      } else {
        engineRef.current.torchOn = !engineRef.current.torchOn;
      }
    }
    if (action === "torchIntensity") {
      if (engineRef.current.cycleTorchIntensity) {
        engineRef.current.cycleTorchIntensity();
      }
    }
    if (action === "uv") {
      engineRef.current.toggleUv();
    }
    if (action === "gingertea") {
      engineRef.current.drinkGingerTea();
    }
    if (action === "crank") {
      engineRef.current.crankDynamo();
    }
    if (action === "hud") {
      setIsImmersiveHud((prev) => !prev);
    }
    if (action === "quality") {
      if (engineRef.current && engineRef.current.cycleQuality) {
        engineRef.current.cycleQuality();
      }
    }
    if (action === "viewMode") {
      engineRef.current.toggleViewMode();
    }
  };

  // Dial Turn with Mechanical Click SFX
  const handleDialTurn = (dialIndex, delta) => {
    if (engineRef.current) engineRef.current.playSfx("dial");
    if (dialIndex === 1) {
      setDial1((prev) => (prev + delta + DIAL_1_OPTIONS.length) % DIAL_1_OPTIONS.length);
    } else if (dialIndex === 2) {
      setDial2((prev) => (prev + delta + DIAL_2_OPTIONS.length) % DIAL_2_OPTIONS.length);
    } else if (dialIndex === 3) {
      setDial3((prev) => (prev + delta + DIAL_3_OPTIONS.length) % DIAL_3_OPTIONS.length);
    }
  };

  // Dial Lock Puzzle Submit
  const handleRuneSubmit = () => {
    const choice1 = DIAL_1_OPTIONS[dial1];
    const choice2 = DIAL_2_OPTIONS[dial2];
    const choice3 = DIAL_3_OPTIONS[dial3];

    if (choice1.includes("සූර්යයා") && choice2.includes("ගංගාව") && choice3.includes("සිංහයා")) {
      setRunePuzzleOpen(false);
      showToast("[ACCESS GRANTED] රහස් සංකේත නිවැරදියි! ලෙන් දොරටුව විවෘත විය.");
      if (engineRef.current) engineRef.current.playSfx("pickup");
      if (unlockCallbackRef.current) {
        unlockCallbackRef.current();
      }
    } else {
      if (engineRef.current) engineRef.current.playSfx("hurt");
      setPuzzleError("[CODE ERROR] සංකේත ගැලපීම වැරදියි! දිනපොතේ සටහන නැවත සිතා බලන්න.");
      setTimeout(() => setPuzzleError(""), 3500);
    }
  };

  const ch1Count = [evidence.diary, evidence.key, evidence.sample].filter(Boolean).length;
  const ch2Count = [evidence.map2, evidence.tape, evidence.gem].filter(Boolean).length;
  const ch3Count = [evidence.ch3_slate, evidence.ch3_core, evidence.ch3_torch].filter(Boolean).length;
  const ch4Count = [evidence.ch4_docs, evidence.ch4_keycard, evidence.ch4_sample].filter(Boolean).length;
  const ch5Count = [evidence.ch5_blackbox, evidence.ch5_truth, evidence.ch5_beacon].filter(Boolean).length;

  const currentChapterEvidenceCount =
    activeChapter === 2 ? ch2Count :
    activeChapter === 3 ? ch3Count :
    activeChapter === 4 ? ch4Count :
    activeChapter === 5 ? ch5Count : ch1Count;

  const totalEvidenceCount = ch1Count + ch2Count + ch3Count + ch4Count + ch5Count;

  // Dynamic Active Mission Objective Tracking
  const getActiveObjectiveInfo = () => {
    if (activeChapter === 2) {
      if (!stats.tasks?.mapFound) {
        return {
          title: "භූවිද්‍යා සිතියම (Geologist Map)",
          icon: "Map",
          x: 950,
          y: 650,
          desc: "අතහැර දැමූ භූවිද්‍යා කඳවුරේ සිතියම සොයාගන්න",
        };
      }
      if (!stats.tasks?.raftUsed) {
        return {
          title: "උණ බම්බු පහුර (Bamboo Raft)",
          icon: "Target",
          x: 820,
          y: 980,
          desc: "දියඇලි අගාධය තරණය කිරීමට උණ බම්බු පහුර පදින්න",
        };
      }
      if (!stats.tasks?.tapeFound) {
        return {
          title: "හඬපටය (Cassette Tape)",
          icon: "Tape",
          x: 1800,
          y: 1750,
          desc: "ජලයෙන් පෙඟුණු පටිගත කළ හඬපටය අහුලාගන්න",
        };
      }
      if (!stats.tasks?.gemFound) {
        return {
          title: "ස්ඵටික සාම්පලය (Crystal Sample)",
          icon: "Crystal",
          x: 2400,
          y: 1500,
          desc: "පැරණි පතලෙන් දීප්තිමත් නිල් ස්ඵටිකය ලබාගන්න",
        };
      }
      return {
        title: "සංඥා කුලුන (Signal Tower)",
        icon: "Tower",
        x: 2850,
        y: 1900,
        desc: "කඳු මුදුනේ සංඥා කුලුන වෙත ගොස් පණිවිඩය යවන්න",
      };
    }

    if (activeChapter === 3) {
      if (!stats.tasks?.slateFound) {
        return {
          title: "පුරාණ ශිලා ලේඛනය (Ancient Inscription)",
          icon: "Scroll",
          x: 650,
          y: 550,
          desc: "ලෙන් කුහරයේ පැරණි ශිලා ලේඛනය කියවා සාක්ෂි එකතු කරන්න",
        };
      }
      if (!stats.tasks?.maskFound) {
        return {
          title: "වායු මුහුණු ආවරණය (Miner's Gas Mask)",
          icon: "Mask",
          x: 920,
          y: 620,
          desc: "විෂ සල්ෆර් වායුවෙන් බේරීමට වායු මුහුණු ආවරණය පළඳින්න",
        };
      }
      if (!stats.tasks?.floodgateUsed) {
        return {
          title: "භූගත සොරොව් චක්‍රය (Floodgate Wheel)",
          icon: "Gear",
          x: 1450,
          y: 650,
          desc: "ගිලීගිය ලෙන් ශුද්ධ භූමියේ ජලය බැස්සවීමට සොරොව්ව කරකවන්න",
        };
      }
      if (!stats.tasks?.coreFound) {
        return {
          title: "ප්‍රතිදීප්ත අගාධ පාෂාණය (Resonance Crystal)",
          icon: "Orb",
          x: 1650,
          y: 1450,
          desc: "ජලය බැසගිය ශුද්ධ භූමියෙන් දම් පැහැති දීප්තිමත් පාෂාණය ලබාගන්න",
        };
      }
      if (!stats.tasks?.logFound) {
        return {
          title: "පතල් කම්කරු සටහන (Miner's Log)",
          icon: "Lantern",
          x: 2350,
          y: 1550,
          desc: "1987 පතල් කම්කරුවන්ගේ අවසාන වාර්තාව පරීක්ෂා කරන්න",
        };
      }
      return {
        title: "භූගත එසවුම් යන්ත්‍රය (Hydraulic Lift)",
        icon: "Target",
        x: 2800,
        y: 1850,
        desc: "අගාධයෙන් ඉහළට විහිදෙන ලිෆ්ට් එක ක්‍රියාත්මක කරන්න",
      };
    }

    if (activeChapter === 4) {
      if (!stats.tasks?.generatorFixed) {
        return {
          title: "ප්‍රධාන ජෙනරේටරය (Diesel Generator)",
          icon: "Bolt",
          x: 650,
          y: 420,
          desc: "විද්‍යාගාරයේ ප්‍රධාන ඩීසල් ජෙනරේටරය පණගන්වන්න",
        };
      }
      if (!stats.tasks?.docsFound) {
        return {
          title: "පරිගණක පර්යන්තය (Mainframe Terminal)",
          icon: "Folder",
          x: 850,
          y: 650,
          desc: "1987 රහස් ව්‍යාපෘති ලිපිගොනු පරීක්ෂා කරන්න",
        };
      }
      if (!stats.tasks?.breakerPulled) {
        return {
          title: "විදුලි විසන්ධිකාරකය (Breaker Switch)",
          icon: "Gear",
          x: 1050,
          y: 720,
          desc: "ජල තටාකයේ විදුලි ධාරාව විසන්ධි කරන්න",
        };
      }
      if (!stats.tasks?.keycardFound) {
        return {
          title: "Level 3 ප්‍රවේශ කාඩ්පත (Keycard)",
          icon: "Keycard",
          x: 1350,
          y: 620,
          desc: "ක්‍රයෝ-කුටිය විවෘත කළ හැකි විද්‍යුත් කාඩ්පත අහුලාගන්න",
        };
      }
      if (!stats.tasks?.dnaFound) {
        return {
          title: "ක්‍රයෝ-පර්යේෂණ කුටිය (Cryo Containment)",
          icon: "Dna",
          x: 2350,
          y: 1350,
          desc: "විකෘති DNA සාම්පලය සුරක්ෂිතව ලබාගන්න",
        };
      }
      return {
        title: "වියන් මොනොරේල් පිවිසුම (Canopy Airlock)",
        icon: "Target",
        x: 2850,
        y: 1850,
        desc: "මොනොරේල් වායු අගුළුව විවෘත කර වියන් මාවතට යන්න",
      };
    }

    if (activeChapter === 5) {
      if (!stats.tasks?.blackboxFound) {
        return {
          title: "ගවේෂණ කළු පෙට්ටිය (Blackbox)",
          icon: "Box",
          x: 750,
          y: 550,
          desc: "කඩා වැටුණු හෙලිකොප්ටරයේ ෆ්ලයිට් රෙකෝඩරය සොයාගන්න",
        };
      }
      if (!stats.tasks?.bridgeCrossed) {
        return {
          title: "ලණු පාලම (Swaying Rope Bridge)",
          icon: "Target",
          x: 1200,
          y: 850,
          desc: "සුළඟට පැද්දෙන යෝධ ලණු පාලම මතින් එතෙර වන්න",
        };
      }
      if (!stats.tasks?.truthFound) {
        return {
          title: "මහාචාර්ය ඩග්ලස්ගේ අවසාන සටහන (Final Truth)",
          icon: "Scroll",
          x: 1750,
          y: 1150,
          desc: "ඩග්ලස්ගේ අවසාන පාපොච්චාරණය සහ ඖෂධ වට්ටෝරුව කියවන්න",
        };
      }
      if (!stats.tasks?.beaconActivated) {
        return {
          title: "සැටලයිට් සම්ප්‍රේෂකය (Satellite Uplink)",
          icon: "Satellite",
          x: 2350,
          y: 1400,
          desc: "සත්‍යය ලොවට මුදාහැරීමට චන්ද්‍රිකා ඇන්ටනාව පෙළගස්වන්න",
        };
      }
      return {
        title: "මහා නාවෘක්ෂ මුරකුළුණ (Skyhook Tower)",
        icon: "Tower",
        x: 2850,
        y: 1850,
        desc: "අවසාන ගැලවුම් සංඥාව දල්වා හෙලිකොප්ටරය අමතන්න",
      };
    }

    // Chapter 01 (Genuine 3D Coordinates & Real-World Meters)
    if (!stats.tasks?.diaryFound) {
      return {
        title: lang === "en" ? "Douglas Field Journal" : "මුරපොළේ දිනපොත (Ranger Diary)",
        icon: "Book",
        x: 517,
        y: 715,
        desc: lang === "en"
          ? "Investigate the Kudawa Outpost workbench and secure Douglas's field notes"
          : "අතහැර දැමූ මුරපොළේ මේසය පරීක්ෂා කර ඩග්ලස්ගේ දිනපොත සොයාගන්න",
      };
    }
    if (!stats.tasks?.keyFound) {
      return {
        title: lang === "en" ? "Antique Brass Key" : "පුරාණ පිත්තල යතුර (Ancient Key)",
        icon: "Key",
        x: 512,
        y: 735,
        desc: lang === "en"
          ? "Locate the antique brass key resting atop the river boulder"
          : "ගංගා නිම්නයේ ගල් පර්වතය මත ඇති පැරණි පිත්තල යතුර සොයාගන්න",
      };
    }
    if (!stats.tasks?.sampleFound) {
      return {
        title: lang === "en" ? "Ancient Monolith Cave & Sample" : "භූගත ලෙන & සාම්පලය (Rune Cave)",
        icon: "Target",
        x: 495,
        y: 840,
        desc: lang === "en"
          ? "Align the three runes to breach the monolith gate and extract the sample"
          : "රහස් සංකේත ගලපා ලෙන් දොරටුව විවෘත කර දිලීර සාම්පලය ලබාගන්න",
      };
    }
    return {
      title: lang === "en" ? "Extraction Helipad" : "ගලවා ගැනීමේ හෙලිපෑඩ් (Rescue Helipad)",
      icon: "Helicopter",
      x: 545,
      y: 855,
      desc: lang === "en"
        ? "Head to the summit ridge helipad and fire the distress rocket for extraction"
        : "කඳු මුදුනේ හෙලිකොප්ටර් කලාපයට ගොස් සංඥා රොකට්ටුව දල්වා මෙහෙයුම අවසන් කරන්න",
    };
  };

  const activeObj = getActiveObjectiveInfo();
  const distToActiveObj = activeChapter === 1
    ? Math.round(Math.hypot(activeObj.x - stats.playerX, activeObj.y - stats.playerY))
    : Math.round(Math.hypot(activeObj.x - stats.playerX, activeObj.y - stats.playerY) / 10);

  // Heart Rate BPM (Simulated based on health/danger)
  const heartBpm = stats.bleeding || stats.health < 40 ? 138 : stats.health < 75 ? 96 : 72;

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1: CHAPTER SELECT SCREEN (FLASHCARDS & MISSION DOSSIER)
  // ══════════════════════════════════════════════════════════════════════════
  if (currentView === "chapters") {
    return (
      <div className="chapter-select-screen">
        <div className="fog-overlay" />

        <div className="select-header">
          <div className="header-titles">
            <span className="sub-badge">{I18N[lang].expedition_dossier}</span>
            <h1 className="main-title">{I18N[lang].select_chapter}</h1>
            <p className="main-subtitle">{I18N[lang].tagline_main}</p>
          </div>

          <div className="top-action-bar">
            <button
              className="action-pill lang-pill"
              onClick={toggleLanguage}
              title="භාෂාව මාරු කරන්න / Switch Language"
            >
              🌐 {lang === "en" ? "EN ⟷ සිංහල" : "සිංහල ⟷ EN"}
            </button>
            <button
              className="action-pill fullscreen-pill"
              onClick={toggleFullscreen}
              title={isFullscreen ? I18N[lang].exit_fullscreen : I18N[lang].fullscreen}
            >
              <Icons.Zoom className="tactical-svg-icon" /> {isFullscreen ? I18N[lang].exit_fullscreen : I18N[lang].fullscreen}
            </button>
            <button
              className="action-pill evidence-pill"
              onClick={() => setShowEvidenceBoard(true)}
            >
              <Icons.Evidence className="tactical-svg-icon" /> {I18N[lang].evidence_board} ({totalEvidenceCount} / 15)
            </button>
            <button
              className="action-pill trophy-pill"
              onClick={() => setShowTrophies(true)}
            >
              <Icons.Trophy className="tactical-svg-icon" /> {I18N[lang].achievements} ({unlockedAchievements.length} / {MASTER_ACHIEVEMENTS.length})
            </button>
            <button
              className="action-pill journal-pill"
              onClick={() => setShowJournal(true)}
            >
              <Icons.Journal className="tactical-svg-icon" /> {I18N[lang].field_guide} ({journal.length})
            </button>
          </div>
        </div>

        {/* Continue Saved Expedition Banner */}
        {completedChapters.length > 0 && (
          <div className="continue-expedition-banner">
            <span><Icons.Disk className="tactical-svg-icon" /> මෙහෙයුම් ප්‍රගතිය සුරක්ෂිතයි // DOSSIER ACTIVE ({completedChapters.length} / 5 COMPLETED)</span>
            <button
              className="continue-btn"
              onClick={() => launchChapter([1, 2, 3, 4, 5].find((c) => !completedChapters.includes(c)) || 1)}
            >
              ඉදිරියට යන්න (CONTINUE EXPEDITION) ▶
            </button>
          </div>
        )}

        <div className="chapters-grid">
          {CHAPTERS.map((chap) => {
            const isUnlocked = unlockedChapters.includes(chap.id);
            const isDone = completedChapters.includes(chap.id);
            return (
              <div
                key={chap.id}
                className={`chapter-flashcard ${isUnlocked ? "unlocked" : "locked"} ${
                  isDone ? "completed-card" : ""
                }`}
                onClick={() => isUnlocked && launchChapter(chap.id)}
              >
                <div
                  className="flashcard-image"
                  style={{ backgroundImage: `url(${chap.image})` }}
                >
                  <div className="card-badge-row">
                    <span className="chap-num-badge">{chap.title}</span>
                    <span className={`status-badge ${isDone ? "completed" : isUnlocked ? "active" : "locked"}`}>
                      {isDone ? "✓ COMPLETED" : isUnlocked ? "READY" : "CLASSIFIED"}
                    </span>
                  </div>
                  {chap.climate && (
                    <span className="card-climate-badge">{chap.climate}</span>
                  )}
                </div>

                <div className="flashcard-body">
                  <span className="chap-watermark-num">0{chap.id}</span>
                  <h2 className="chap-sinhala">{chap.nameSinhala}</h2>
                  <h3 className="chap-english">{chap.nameEnglish}</h3>
                  <p className="chap-tagline">“{chap.tagline}”</p>
                  <p className="chap-desc">{chap.desc}</p>

                  {chap.evidenceList && (
                    <div className="card-evidence-box">
                      <span className="evidence-box-title"><Icons.Target className="tactical-svg-icon" /> මෙහෙයුම් ඉලක්ක හා සාක්ෂි:</span>
                      <div className="evidence-tags">
                        {chap.evidenceList.map((ev) => {
                          const isFound = evidence[ev.id];
                          return (
                            <span
                              key={ev.id}
                              className={`ev-tag ${isFound ? "found" : "missing"}`}
                            >
                              <span className="ev-tag-status-dot" /> {ev.name} {isFound ? "✓" : "○"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!isUnlocked && (
                    <div className="lock-reason">
                      <Icons.Lock className="tactical-svg-icon" /> {chap.reqMsg}
                    </div>
                  )}

                  <button
                    className={`chap-play-btn ${isUnlocked ? "btn-primary" : "btn-locked"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isUnlocked) {
                        launchChapter(chap.id);
                      } else {
                        showToast(`[LOCKED] ${chap.title} අගුළු වැටී ඇත! එය විවෘත කිරීමට Chapter 0${chap.id - 1} සම්පූර්ණ කරන්න.`);
                      }
                    }}
                  >
                    {isUnlocked ? (isDone ? `REPLAY ${chap.title} ▶` : `DEPLOY ${chap.title} ▶`) : `🔒 LOCKED (COMPLETE CH 0${chap.id - 1})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {toastMsg && <div className="game-toast-floating">{toastMsg}</div>}

        {/* Evidence Board Modal */}
        {showEvidenceBoard && (
          <div className="evidence-modal" onClick={() => setShowEvidenceBoard(false)}>
            <div className="evidence-board" onClick={(e) => e.stopPropagation()}>
              <div className="board-header">
                <h2><Icons.Evidence className="tactical-svg-icon" /> සිංහරාජ රහස් සාක්ෂි පුවරුව (EVIDENCE CASE BOARD)</h2>
                <button className="close-btn" onClick={() => setShowEvidenceBoard(false)}>✕</button>
              </div>

              <div className="case-progress-wrap">
                <span>සමස්ත සාක්ෂි ප්‍රගතිය:</span>
                <div className="case-progress-bar">
                  <div
                    className="case-progress-fill"
                    style={{ width: `${((ch1Count + ch2Count + ch3Count + ch4Count + ch5Count) / 15) * 100}%` }}
                  />
                </div>
                <span>{ch1Count + ch2Count + ch3Count + ch4Count + ch5Count} / 15 සාක්ෂි හමුවී ඇත ({Math.round(((ch1Count + ch2Count + ch3Count + ch4Count + ch5Count) / 15) * 100)}%)</span>
              </div>

              <h3 className="section-dossier-title">CHAPTER 01: කුඩව පිවිසුම සාක්ෂි</h3>
              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.diary ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon"><Icons.Book className="tactical-svg-icon" /></div>
                  <h3>ලෙයින් පෙඟුණු දිනපොත</h3>
                  <p>
                    {evidence.diary
                      ? "1987 නොවැම්බර් 14: ඔවුන් ගල් ලෙන තුළට ගිය බවත් ලෙන් දොරටුවේ රහස් සංකේත [සූර්යයා, ගංගාව, සිංහයා] බවත් තහවුරු කරයි."
                      : "තවමත් හමුවී නැත. අතහැර දැමූ මුරපොළ පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.diary ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.key ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon"><Icons.Key className="tactical-svg-icon" /></div>
                  <h3>පුරාණ පිත්තල යතුර</h3>
                  <p>
                    {evidence.key
                      ? "සිංහරාජයේ රහස් භූගත ලෙනේ අගුළු විවෘත කළ හැකි පැරණි පිත්තල යතුර."
                      : "තවමත් හමුවී නැත. ගංගා නිම්නයේ ඔරු තොට පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.key ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.sample ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon"><Icons.Vial className="tactical-svg-icon" /></div>
                  <h3>පර්යේෂණ සාම්පලය</h3>
                  <p>
                    {evidence.sample
                      ? "වසර 30ක් අතුරුදහන් වූ ගවේෂකයන්ගේ ප්‍රතිදීප්ත දිලීර අඩංගු අභිරහස් බඳුන."
                      : "තවමත් හමුවී නැත. අගුළු දැමූ ගල් ලෙන තුළ ඇත..."}
                  </p>
                  <span className="status-tag">{evidence.sample ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>

              <h3 className="section-dossier-title" style={{ marginTop: 24 }}>CHAPTER 02: දියඇලි නිම්නය සාක්ෂි</h3>
              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.map2 ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon"><Icons.Map className="tactical-svg-icon" /></div>
                  <h3>භූවිද්‍යාඥයින්ගේ සිතියම</h3>
                  <p>
                    {evidence.map2
                      ? "දියඇලි නිම්නය හරහා උණ බම්බු පහුරෙන් ගමන් කරන මාර්ගය සහ රහස් පතලේ පිවිසුම සලකුණු කර ඇත."
                      : "තවමත් හමුවී නැත. භූවිද්‍යා කඳවුරේ මේසය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.map2 ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.tape ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon"><Icons.Tape className="tactical-svg-icon" /></div>
                  <h3>පටිගත කළ හඬපටය</h3>
                  <p>
                    {evidence.tape
                      ? "අතුරුදහන් වූ ගවේෂකයන්ගේ අවසාන හඬ පණිවිඩය: 'කඳු මුදුනේ මුරකුළුණෙන් සංඥා කරන්න!'"
                      : "තවමත් හමුවී නැත. දියඇල්ල අසල ගල්පර පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.tape ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.gem ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon"><Icons.Crystal className="tactical-svg-icon" /></div>
                  <h3>නිල් ස්ඵටික සාම්පලය</h3>
                  <p>
                    {evidence.gem
                      ? "පැරණි පතල ඇතුළතින් සොයාගත් නිල් ආලෝකය විහිදුවන අභිරහස් ස්ඵටිකය."
                      : "තවමත් හමුවී නැත. පතල් කුහරය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.gem ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>

              <h3 className="section-dossier-title" style={{ marginTop: 24 }}>CHAPTER 03: යක්ෂ ගිරි භූගත අගාධය සාක්ෂි</h3>
              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.ch3_slate ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon"><Icons.Scroll className="tactical-svg-icon" /></div>
                  <h3>ප්‍රාග් ඓතිහාසික ශිලා ලේඛනය</h3>
                  <p>
                    {evidence.ch3_slate
                      ? "පුරාණ ලෙන් කුටියේ තිබූ සොරොව්ව සහ ගිලීගිය ශුද්ධ භූමිය පිළිබඳ සටහන්."
                      : "තවමත් හමුවී නැත. ලෙන් පිවිසුම අසල පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch3_slate ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch3_core ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon"><Icons.Orb className="tactical-svg-icon" /></div>
                  <h3>ප්‍රතිදීප්ත අගාධ පාෂාණය</h3>
                  <p>
                    {evidence.ch3_core
                      ? "ගිලීගිය ලෙන් ශුද්ධ භූමියේ ජලය බැසයාමෙන් පසු හමුවූ දම් පැහැති දීප්තිමත් ස්ඵටිකය."
                      : "තවමත් හමුවී නැත. සොරොව්ව කරකවා ජලය බැස්සවීමෙන් පසු ලබාගන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch3_core ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch3_torch ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon"><Icons.Lantern className="tactical-svg-icon" /></div>
                  <h3>පතල් කම්කරු අවසාන සටහන</h3>
                  <p>
                    {evidence.ch3_torch
                      ? "1987 පතල් කම්කරුවන් අගාධයෙන් ඉහළ රහස් විද්‍යාගාරයට පිවිසි බව තහවුරු කරන ලිපිය."
                      : "තවමත් හමුවී නැත. අගාධ කෙළවර පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch3_torch ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>

              <h3 className="section-dossier-title" style={{ marginTop: 24 }}>CHAPTER 04: නටබුන් වූ රහස් පර්යේෂණාගාරය සාක්ෂි</h3>
              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.ch4_docs ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon"><Icons.Folder className="tactical-svg-icon" /></div>
                  <h3>1987 රහස් ව්‍යාපෘති ලිපිගොනුව</h3>
                  <p>
                    {evidence.ch4_docs
                      ? "පරිගණක පර්යන්තයෙන් ලබාගත් රහස් ජෛව විද්‍යාත්මක පර්යේෂණ වාර්තාව."
                      : "තවමත් හමුවී නැත. ප්‍රධාන පරිගණකය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch4_docs ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch4_keycard ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon"><Icons.Keycard className="tactical-svg-icon" /></div>
                  <h3>Level 3 ප්‍රවේශ කාඩ්පත</h3>
                  <p>
                    {evidence.ch4_keycard
                      ? "ක්‍රයෝ-කුටිය සහ වියන් මොනොරේල් දොරටුව විවෘත කිරීමට හැකි ආරක්ෂක කාඩ්පත."
                      : "තවමත් හමුවී නැත. කාර්යාල මේසය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch4_keycard ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch4_sample ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon"><Icons.Dna className="tactical-svg-icon" /></div>
                  <h3>විකෘති DNA සාම්පලය</h3>
                  <p>
                    {evidence.ch4_sample
                      ? "වසර 30ක් ආරක්ෂිතව පැවති දුර්ලභ ශාක-සත්ව විකෘති ජෛව සාම්පලය."
                      : "තවමත් හමුවී නැත. ක්‍රයෝ-කුටිය විවෘත කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch4_sample ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>

              <h3 className="section-dossier-title" style={{ marginTop: 24 }}>CHAPTER 05: මහා නාවෘක්ෂය සහ අවසාන සත්‍යය සාක්ෂි</h3>
              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.ch5_blackbox ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon"><Icons.Box className="tactical-svg-icon" /></div>
                  <h3>ගවේෂණ කළු පෙට්ටිය (Blackbox)</h3>
                  <p>
                    {evidence.ch5_blackbox
                      ? "1987 හෙලිකොප්ටර් අනතුරේ සම්පූර්ණ ටෙලිමෙට්‍රි සහ සංවාද දත්ත අඩංගු ෆ්ලයිට් රෙකෝඩරය."
                      : "තවමත් හමුවී නැත. වියන් මාවත ආරම්භය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch5_blackbox ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch5_truth ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon"><Icons.Scroll className="tactical-svg-icon" /></div>
                  <h3>මහාචාර්ය ඩග්ලස්ගේ අවසාන පාපොච්චාරණය</h3>
                  <p>
                    {evidence.ch5_truth
                      ? "සිංහරාජයේ රහස සහ විකෘති ශාකයෙන් සුව කළ හැකි විශ්වීය ඖෂධීය සූත්‍රය."
                      : "තවමත් හමුවී නැත. වියන් කුටිය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch5_truth ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch5_beacon ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon"><Icons.Satellite className="tactical-svg-icon" /></div>
                  <h3>සැටලයිට් බීකන සම්ප්‍රේෂණය</h3>
                  <p>
                    {evidence.ch5_beacon
                      ? "සත්‍යය මුළු ලොවටම ප්‍රචාරය කරමින් චන්ද්‍රිකාව හා සම්බන්ධ වූ සක්‍රිය බීකනය."
                      : "තවමත් පෙළගස්වා නැත. සැටලයිට් ඇන්ටනාව ක්‍රියාත්මක කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch5_beacon ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trophies & Achievements Modal */}
        {showTrophies && (
          <div className="trophy-modal-overlay" onClick={() => setShowTrophies(false)}>
            <div className="trophy-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="trophy-modal-header">
                <h2><Icons.Trophy className="tactical-svg-icon" /> ගවේෂක සම්මාන සහ ජයග්‍රහණ (EXPLORER ACHIEVEMENTS)</h2>
                <button className="close-btn" onClick={() => setShowTrophies(false)}>✕</button>
              </div>
              <p className="trophy-modal-sub">
                සිංහරාජයේ විශේෂ ක්‍රියාකාරකම් සහ මෙහෙයුම් සම්පූර්ණ කර සම්මාන අගුළු හරින්න.
              </p>
              <div className="trophies-grid">
                {MASTER_ACHIEVEMENTS.map((ach) => {
                  const isAchieved = unlockedAchievements.includes(ach.id);
                  return (
                    <div key={ach.id} className={`trophy-card ${isAchieved ? "unlocked" : "locked"}`}>
                      <div className="trophy-icon-wrap">
                        <span className="trophy-icon">
                          {Icons[ach.icon] ? React.createElement(Icons[ach.icon], { className: "tactical-svg-icon" }) : <Icons.Trophy className="tactical-svg-icon" />}
                        </span>
                        {isAchieved && <span className="trophy-check">✓</span>}
                      </div>
                      <div className="trophy-info">
                        <h3>{ach.nameSinhala}</h3>
                        <span className="trophy-en">{ach.nameEnglish}</span>
                        <p>{ach.desc}</p>
                        <span className={`trophy-status-tag ${isAchieved ? "status-done" : "status-lock"}`}>
                          {isAchieved ? "UNLOCKED [VERIFIED]" : "CLASSIFIED [LOCKED]"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Field Journal Modal */}
        {showJournal && (
          <div className="journal-modal" onClick={() => setShowJournal(false)}>
            <div className="journal-content" onClick={(e) => e.stopPropagation()}>
              <div className="journal-header">
                <h2><Icons.Journal className="tactical-svg-icon" /> සිංහරාජ වනජීවී සටහන් සහ ඇල්බමය</h2>
                <button className="close-btn" onClick={() => setShowJournal(false)}>✕</button>
              </div>

              <div className="journal-tabs">
                <button
                  className={`journal-tab-btn ${journalTab === "guide" ? "active" : ""}`}
                  onClick={() => setJournalTab("guide")}
                >
                  <Icons.Book className="tactical-svg-icon" /> වනජීවී සටහන් (FIELD GUIDE)
                </button>
                <button
                  className={`journal-tab-btn ${journalTab === "photos" ? "active" : ""}`}
                  onClick={() => setJournalTab("photos")}
                >
                  <Icons.Camera className="tactical-svg-icon" /> ඡායාරූප ඇල්බමය ({capturedPhotos.length}/4)
                </button>
              </div>

              {journalTab === "guide" ? (
                <div className="journal-list">
                  {journal.map((item, i) => (
                    <div key={i} className="journal-card">
                      <h3>{item.title}</h3>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="photo-gallery-grid">
                  {capturedPhotos.length === 0 ? (
                    <div className="empty-gallery-box">
                      <span className="empty-cam-icon"><Icons.Camera className="tactical-svg-icon" /></span>
                      <p>තවමත් කිසිදු ඡායාරූපයක් ගෙන නොමැත.</p>
                      <small>කැලයේ සතුන් (කැහිබෙල්ලා, වඳුරන්, පොළඟා, කලාමැදිරියන්) අසලදී <strong>[C]</strong> ඔබා ඡායාරූප ගන්න!</small>
                    </div>
                  ) : (
                    capturedPhotos.map((photo) => (
                      <div key={photo.id} className="polaroid-photo-item">
                        <div className="polaroid-img-preview">
                          <span className="polaroid-preview-icon"><Icons.Camera className="tactical-svg-icon" /></span>
                          <span className="polaroid-badge">FIELD PHOTO</span>
                        </div>
                        <div className="polaroid-item-info">
                          <h4>{photo.name}</h4>
                          <p>{photo.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2: PLAYING GAMEPLAY (NEXT-GEN GAMING HUD INTERFACE)
  // ══════════════════════════════════════════════════════════════════════════
  if (showDebriefing) {
    const minutes = Math.floor(stats.elapsedTime / 60);
    const seconds = stats.elapsedTime % 60;
    const isGradeS = capturedPhotos.length >= 4 && stats.feathersCollected >= 3;
    const isGradeA = capturedPhotos.length >= 2 || stats.feathersCollected >= 2;
    const grade = isGradeS ? "S" : isGradeA ? "A" : "B";
    const gradeTitle = isGradeS
      ? "GRADE S: MASTER SINHARAJA RANGER"
      : isGradeA
      ? "GRADE A: SENIOR FIELD RANGER"
      : "GRADE B: SINHARAJA SURVIVOR";

    return (
      <div className="mission-debriefing-screen">
        <div className="crt-scanline-overlay" />
        <div className="debriefing-card-panel">
          <div className="debrief-stamp-seal">OFFICIAL DOSSIER</div>

          <div className="debrief-header">
            <span className="debrief-sub">EXPEDITION PERFORMANCE EVALUATION // 1987 ARCHIVE</span>
            <h1 className="debrief-title">MISSION DEBRIEFING REPORT</h1>
            <p className="debrief-mission-name">CHAPTER 01: KUDAWA TRAILHEAD (කුඩව පිවිසුම)</p>
          </div>

          <div className="debrief-grade-banner">
            <div className={`grade-letter grade-${grade.toLowerCase()}`}>{grade}</div>
            <div className="grade-info">
              <span className="grade-status-tag">EVALUATION RATING</span>
              <h2 className="grade-headline">{gradeTitle}</h2>
              <p className="grade-desc">
                {lang === "en"
                  ? (isGradeS
                    ? "Outstanding! You recovered all critical evidence, captured rare endemic wildlife photographs, and reached the extraction zone with supreme tactical survival efficiency!"
                    : isGradeA
                    ? "Well done! You secured the main expedition evidence, blue magpie feathers, and signaled the rescue helicopter amid the raging storm."
                    : "You survived the perilous Kudawa trail and extracted with Douglas's research intact. Attempt to locate all fauna photos and blue magpie feathers for Grade S rating.")
                  : (isGradeS
                    ? "විශිෂ්ටයි! ඔබ සියලු සාක්ෂි, සියලු වනජීවී ඡායාරූප සහ කැහිබෙලි පිහාටු සොයාගෙන පරිපූර්ණ ගවේෂණයක නිරත විය!"
                    : isGradeA
                    ? "ඉතා හොඳයි! ඔබ ප්‍රධාන සාක්ෂි සහ වනජීවී සාක්ෂි සාර්ථකව සම්පූර්ණ කර ගලවාගැනීමේ හෙලිකොප්ටරය වෙත ළඟා විය."
                    : "ඔබ සාර්ථකව දිවි ගලවාගෙන සාක්ෂි සුරක්ෂිත කළා. උපරිම ලකුණු සඳහා සියලු ඡායාරූප ගැනීමට උත්සාහ කරන්න.")}
              </p>
            </div>
          </div>

          <div className="debrief-stats-grid">
            <div className="debrief-stat-card">
              <span className="stat-label"><Icons.Clock className="tactical-svg-icon" /> {lang === "en" ? "ELAPSED TIME" : "ගතවූ කාලය (TIME)"}</span>
              <strong className="stat-val">{minutes}m {seconds < 10 ? `0${seconds}` : seconds}s</strong>
            </div>
            <div className="debrief-stat-card">
              <span className="stat-label"><Icons.Evidence className="tactical-svg-icon" /> {lang === "en" ? "EVIDENCE RECOVERED" : "සාක්ෂි (EVIDENCE)"}</span>
              <strong className="stat-val">3 / 3 (100%)</strong>
            </div>
            <div className="debrief-stat-card">
              <span className="stat-label"><Icons.Camera className="tactical-svg-icon" /> {lang === "en" ? "WILDLIFE PHOTOS" : "වනජීවී ඡායාරූප (PHOTOS)"}</span>
              <strong className="stat-val">{capturedPhotos.length} / 4</strong>
            </div>
            <div className="debrief-stat-card">
              <span className="stat-label"><Icons.Feather className="tactical-svg-icon" /> {lang === "en" ? "BLUE MAGPIE FEATHERS" : "කැහිබෙලි පිහාටු (FEATHERS)"}</span>
              <strong className="stat-val">{stats.feathersCollected} / 3</strong>
            </div>
            <div className="debrief-stat-card">
              <span className="stat-label"><Icons.Heart className="tactical-svg-icon" /> {lang === "en" ? "HEALTH REMAINING" : "සෞඛ්‍ය තත්ත්වය (HEALTH)"}</span>
              <strong className="stat-val">{stats.health}%</strong>
            </div>
            <div className="debrief-stat-card">
              <span className="stat-label"><Icons.Brain className="tactical-svg-icon" /> {lang === "en" ? "MENTAL SANITY" : "මානසික සුවය (SANITY)"}</span>
              <strong className="stat-val">{stats.sanity}%</strong>
            </div>
          </div>

          <div className="debrief-action-buttons">
            <button
              className="debrief-btn primary-next-btn"
              onClick={() => {
                setShowDebriefing(false);
                launchChapter(2);
              }}
            >
              {lang === "en" ? "PROCEED TO CHAPTER 02 ▶" : "CHAPTER 02 වෙත පිවිසෙන්න (PROCEED TO CHAPTER 02) ▶"}
            </button>
            <button
              className="debrief-btn"
              onClick={() => {
                setShowEvidenceBoard(true);
              }}
            >
              <Icons.Evidence className="tactical-svg-icon" /> {lang === "en" ? "EVIDENCE BOARD" : "සාක්ෂි පුවරුව (EVIDENCE BOARD)"}
            </button>
            <button
              className="debrief-btn"
              onClick={() => {
                setShowDebriefing(false);
                launchChapter(1);
              }}
            >
              <Icons.Restart className="tactical-svg-icon" /> {lang === "en" ? "REPLAY CHAPTER 01" : "නැවත සෙල්ලම් කරන්න (REPLAY CH 1)"}
            </button>
            <button
              className="debrief-btn secondary"
              onClick={() => {
                setShowDebriefing(false);
                setCurrentView("chapters");
              }}
            >
              <Icons.Exit className="tactical-svg-icon" /> {lang === "en" ? "CHAPTER SELECT" : "පරිච්ඡේද තෝරන්න (CHAPTER SELECT)"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    let title = I18N[lang].game_over_dead_title;
    let msg = I18N[lang].game_over_dead_msg;
    let cls = "dead-screen";

    if (gameOver === "insane") {
      title = I18N[lang].game_over_insane_title;
      msg = I18N[lang].game_over_insane_msg;
      cls = "insane-screen";
    } else if (gameOver === "won") {
      cls = "won-screen";
      title = I18N[lang].victory_title;
      msg = victoryType === "hero" ? I18N[lang].victory_hero_msg : I18N[lang].victory_survivor_msg;
    }

    return (
      <div className={`game-over-screen ${cls}`}>
        <div className="game-over-modal">
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
            <button
              className="action-pill lang-pill"
              onClick={toggleLanguage}
              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
            >
              🌐 {lang === "en" ? "EN ⟷ සිංහල" : "සිංහල ⟷ EN"}
            </button>
          </div>
          <h1 className="game-over-title">{title}</h1>
          <p className="game-over-msg">{msg}</p>
          <div className="modal-buttons">
            <button className="start-btn" onClick={() => launchChapter(activeChapter)}>
              {I18N[lang].play_again} ▶
            </button>
            <button className="start-btn secondary-btn" onClick={() => setCurrentView("chapters")}>
              {I18N[lang].quit_to_menu}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`playable-game-viewport ${stats.health < 30 ? "low-health-vignette" : ""} ${
        stats.sanity < 30 ? "insanity-glitch" : ""
      }`}
    >
      <canvas ref={canvasRef} className="game-canvas" />

      {/* Screen Effects */}
      <div className="crt-scanline-overlay" />

      {/* Achievement Unlocked Floating Toast */}
      {achievementToast && (
        <div className="achievement-unlocked-banner">
          <div className="achievement-trophy-glow">
            {Icons[achievementToast.icon] ? React.createElement(Icons[achievementToast.icon], { className: "tactical-svg-icon" }) : <Icons.Trophy className="tactical-svg-icon" />}
          </div>
          <div className="achievement-text-wrap">
            <span className="achievement-badge-title"><Icons.Trophy className="tactical-svg-icon" /> ජයග්‍රහණයක් අගුළු හැරුණි! (ACHIEVEMENT UNLOCKED)</span>
            <strong className="achievement-name">{achievementToast.name}</strong>
          </div>
        </div>
      )}

      {/* ── Walkie-Talkie Radio Transmission HUD Banner ── */}
      {radioTransmission && (
        <div className="radio-dispatch-banner" onClick={() => setRadioTransmission(null)}>
          <div className="radio-walkie-icon"><Icons.Radio className="tactical-svg-icon" /></div>
          <div className="radio-body">
            <div className="radio-header-strip">
              <span className="radio-callsign"><Icons.Satellite className="tactical-svg-icon" /> {radioTransmission.callsign || radioTransmission.speaker || "HQ DISPATCH"}</span>
              <div className="radio-signal-bars">
                <span className="sig-bar bar-1" />
                <span className="sig-bar bar-2" />
                <span className="sig-bar bar-3" />
                <span className="sig-bar bar-4" />
              </div>
              <span className="radio-time">LIVE COMM</span>
            </div>
            <p className="radio-text">{lang === "en" ? (radioTransmission.textEn || radioTransmission.text) : radioTransmission.text}</p>
          </div>
          <button className="radio-dismiss-btn" onClick={() => setRadioTransmission(null)}>✕</button>
        </div>
      )}

      {/* ── Chapter Diegetic Screen Lenses & Overlays ── */}
      {stats.uvMode && (
        <div className="uv-tactical-lens-overlay">
          <div className="uv-hud-reticle" />
          <div className="uv-telemetry-strip">
            <span><Icons.UV className="tactical-svg-icon" /> UV SPECTRUM 395nm // FLUORESCENCE ACTIVE</span>
            <span>AUTO-GAIN +18dB</span>
          </div>
        </div>
      )}

      {(activeChapter === 2 || stats.chapter === 2) && (stats.temperature ?? 100) < 45 && (
        <div
          className="frost-lens-overlay"
          style={{ opacity: Math.max(0.18, Math.min(0.92, (45 - (stats.temperature ?? 100)) / 32)) }}
        />
      )}

      {(activeChapter === 3 || stats.chapter === 3) && (
        <div className="biolum-cave-lens-overlay" />
      )}

      {(activeChapter === 4 || stats.chapter === 4) && (
        <div className="bunker-vhs-lens-overlay">
          <div className="vhs-rec-tag">● REC 1987-11-14</div>
          <span className="vhs-timecode">CAM-04 // UNDERGROUND COMPLEX 87</span>
          <div className="vhs-scan-line" />
        </div>
      )}

      {(activeChapter === 5 || stats.chapter === 5) && (
        <div className="canopy-sunset-lens-overlay" />
      )}

      {/* Low Sanity Hallucination Whispers */}
      {stats.sanity < 36 && sanityWhisper && (
        <div className="insanity-whisper-float animate-whisper-fade">
          “{sanityWhisper}”
        </div>
      )}

      {/* ── TOP HUD CLUSTER (Tactical Biometric + Compass + Radar) ── */}
      {isImmersiveHud ? (
        <div
          className="immersive-hud-toggle-pill animate-fade-in"
          onClick={() => setIsImmersiveHud(false)}
          title="HUD දර්ශනය නැවත පෙන්වන්න [V]"
        >
          <Icons.Eye className="tactical-svg-icon" /> [V] RESTORE TACTICAL HUD
        </div>
      ) : (
        <div className="gaming-hud-top-bar">
          {/* Left: Biometric Survival Pod */}
          <div className="biometric-pod">
            <div className="survivor-profile-tag">
              <span className="profile-callsign">{I18N[lang].callsign}</span>
              <span className={`profile-status ${stats.bleeding ? "status-danger" : stats.teaBuffTimer > 0 ? "status-buff" : stats.nearCampfire ? "status-safe" : "status-ok"}`}>
                {stats.bleeding ? (
                  <><span className="status-led led-red" /> {I18N[lang].critical_trauma}</>
                ) : stats.teaBuffTimer > 0 ? (
                  <><span className="status-led led-amber" /> {I18N[lang].adrenaline_boost}</>
                ) : stats.nearCampfire ? (
                  <><span className="status-led led-cyan" /> {I18N[lang].thermal_safe}</>
                ) : (
                  <><span className="status-led led-green" /> {I18N[lang].vitals_stable}</>
                )}
              </span>
            </div>

            {/* ECG Heart Monitor */}
            <div className={`ecg-heart-row ${stats.bleeding || stats.health < 40 ? "danger-ecg" : ""}`}>
              <span className="heart-icon"><Icons.Heart className="tactical-svg-icon" /></span>
              <svg className="ecg-wave-svg" viewBox="0 0 100 24">
                <path
                  className="ecg-wave-path"
                  d="M0 12 L20 12 L25 4 L30 20 L35 8 L40 14 L45 12 L100 12"
                />
              </svg>
              <span className="ecg-bpm-val">{heartBpm} BPM</span>
            </div>

            {/* Health Bar */}
            <div className="tactical-gauge-row">
              <span className="gauge-label">VIT</span>
              <div className="tactical-gauge-track">
                <div className="gauge-fill health-glow" style={{ width: `${stats.health}%` }} />
              </div>
              <span className="gauge-val">{stats.health}</span>
            </div>

            {/* Sanity Bar */}
            <div className="tactical-gauge-row">
              <span className="gauge-label">PSY</span>
              <div className="tactical-gauge-track">
                <div className="gauge-fill sanity-glow" style={{ width: `${stats.sanity}%` }} />
              </div>
              <span className="gauge-val">{stats.sanity}</span>
            </div>

            {/* Chapter 2 Body Warmth Bar */}
            {(stats.chapter === 2 || activeChapter === 2) && (
              <div className="tactical-gauge-row warmth-row" title="ශරීර උෂ්ණත්වය / Body Warmth [G: ඉඟුරු තේ]">
                <span className="gauge-label warmth-label">TMP</span>
                <div className="tactical-gauge-track">
                  <div
                    className="gauge-fill warmth-glow"
                    style={{
                      width: `${Math.max(0, Math.min(100, stats.temperature ?? 100))}%`,
                      background:
                        (stats.temperature ?? 100) < 30
                          ? "linear-gradient(90deg, #dc2626, #ef4444)"
                          : "linear-gradient(90deg, #0284c7, #38bdf8)",
                    }}
                  />
                </div>
                <span className="gauge-val warmth-val">{Math.round(stats.temperature ?? 100)}%</span>
              </div>
            )}

            {/* Stamina & Battery Row */}
            <div className="sub-gauges-row">
              <div className="mini-gauge" title="ශක්තිය (Stamina)">
                <span className="mini-icon"><Icons.Stamina className="tactical-svg-icon" /></span>
                <div className="mini-track">
                  <div
                    className="mini-fill stamina-fill"
                    style={{
                      width: `${stats.stamina}%`,
                      background: stats.teaBuffTimer > 0 ? "#5ce666" : undefined,
                    }}
                  />
                </div>
              </div>
              <div
                className={`mini-gauge battery-gauge-clickable ${stats.battery < 20 ? "gauge-critical" : ""}`}
                title="විදුලි පන්දම් බැටරිය [R: හෑන්ඩ්-ක්‍රෑන්ක් ඩයිනමෝවෙන් ආරෝපණය කරන්න]"
                onClick={() => handleVirtualAction("crank")}
              >
                <span className="mini-icon"><Icons.Battery className="tactical-svg-icon" /></span>
                <div className="mini-track">
                  <div className={`mini-fill battery-fill ${stats.battery < 20 ? "low-battery-pulse" : ""}`} style={{ width: `${stats.battery}%` }} />
                </div>
                {stats.battery < 25 && <span className="crank-hud-prompt">[R CRANK]</span>}
              </div>
            </div>

            {/* Acoustic Noise Sensor */}
            <div className="acoustic-sensor-row" title="ධ්වනි සංවේදකය (Acoustic Sensor) - ධාවනය හා ක්‍රෑන්ක් කිරීම මඟින් ශබ්දය වැඩි වේ">
              <span className="sensor-tag">
                <Icons.Volume className="tactical-svg-icon" /> {stats.noiseLevel || 14} dB
              </span>
              <div className="sensor-track">
                <div
                  className={`sensor-fill ${(stats.noiseLevel || 14) > 65 ? "noise-danger" : (stats.noiseLevel || 14) > 35 ? "noise-warn" : "noise-stealth"}`}
                  style={{ width: `${Math.min(100, Math.max(12, ((stats.noiseLevel || 14) / 95) * 100))}%` }}
                />
              </div>
              <span className={`sensor-status ${(stats.noiseLevel || 14) > 65 ? "status-danger" : (stats.noiseLevel || 14) > 35 ? "status-warn" : "status-stealth"}`}>
                {(stats.noiseLevel || 14) > 65 ? "DANGER" : (stats.noiseLevel || 14) > 35 ? "ALERT" : "SILENT"}
              </span>
            </div>

            {/* Tactical Hazard Alert Pills */}
            {(stats.venomToxicity > 0 || stats.attachedLeeches > 0 || stats.stalkerEyes) && (
              <div className="tactical-hazard-pills">
                {stats.venomToxicity > 0 && (
                  <div className="hazard-status-pill venom-pill animate-pulse">
                    <Icons.Warning className="tactical-svg-icon" />
                    <span>විෂ {stats.venomToxicity}% [2: ඖෂධ]</span>
                  </div>
                )}
                {stats.attachedLeeches > 0 && (
                  <div className="hazard-status-pill leech-pill animate-pulse">
                    <Icons.WaterDrop className="tactical-svg-icon" />
                    <span>කූඩැල්ලන් x{stats.attachedLeeches} [1: ලුණු]</span>
                  </div>
                )}
                {stats.stalkerEyes && (
                  <div className="hazard-status-pill predator-pill animate-pulse">
                    <Icons.Eye className="tactical-svg-icon" />
                    <span>PREDATOR STALKING! [F: LIGHT]</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Tactical Expedition Compass Bar */}
          <div className="tactical-compass-pod">
            <div className="compass-tape">
              <span className="compass-mark">NW</span>
              <span className="compass-mark dot">·</span>
              <span className="compass-mark primary-mark">N</span>
              <span className="compass-mark dot">·</span>
              <span className="compass-mark">NE</span>
              <span className="compass-mark dot">·</span>
              <span className="compass-mark primary-mark">E</span>
            </div>
            <div className="compass-nav-pointer">▲</div>
            <div className="compass-objective-chip">
              <span className="chip-icon"><Icons.Target className="tactical-svg-icon" /></span>
              <span className="chip-text">{activeObj.title}: <strong>{distToActiveObj}m</strong></span>
            </div>
          </div>

          {/* Right: Handheld GPS Terminal & Audio/Pause Buttons */}
          <div className="gps-terminal-pod">
            <div className="gps-header">
              <span className="gps-label">{CHAPTER_LOCATIONS[activeChapter]?.label || "EXPEDITION TELEMETRY"}</span>
              <span className="gps-coords">{CHAPTER_LOCATIONS[activeChapter]?.coords || "LAT 6.40°N | LON 80.45°E"}</span>
            </div>

            <div
              className="gps-radar-screen"
              title="ක්ලික් කර සම්පූර්ණ සිතියම බලන්න [M]"
              onClick={() => {
                if (engineRef.current) engineRef.current.playSfx("pda_open");
                setShowTacticalMap(true);
              }}
            >
              <div className="radar-sweep-beam" />
              <div
                className="player-radar-dot"
                style={{
                  left: `${(stats.playerX / 3200) * 100}%`,
                  top: `${(stats.playerY / 2400) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${stats.playerAngle || 0}rad)`,
                }}
              >
                <div className="radar-player-arrow" />
              </div>
              <div
                className="obj-radar-dot"
                style={{
                  left: `${(activeObj.x / 3200) * 100}%`,
                  top: `${(activeObj.y / 2400) * 100}%`,
                }}
              />
              <span className="radar-click-hint">MAP [M]</span>
            </div>

            {/* Chapter 2 EMF Proximity Detector */}
            {stats.hasEmf && (
              <div className="emf-proximity-container" title="විද්‍යුත් චුම්භක අනාවරකය (EMF Detector)">
                <div className="emf-label-row">
                  <span className="emf-title"><Icons.EMF className="tactical-svg-icon" /> EMF DETECTOR</span>
                  <span className="emf-level-text">{Math.round((stats.emfProximity || 0) * 100)}%</span>
                </div>
                <div className="emf-meter-track">
                  <div
                    className="emf-meter-fill"
                    style={{
                      width: `${Math.round((stats.emfProximity || 0) * 100)}%`,
                      background:
                        (stats.emfProximity || 0) > 0.7
                          ? "linear-gradient(90deg, #dc2626, #ef4444)"
                          : (stats.emfProximity || 0) > 0.35
                          ? "linear-gradient(90deg, #d97706, #f59e0b)"
                          : "linear-gradient(90deg, #0284c7, #38bdf8)",
                    }}
                  />
                </div>
              </div>
            )}

            <div className="gps-controls-row">
              {stats.uvUnlocked && (
                <button
                  className={`tactical-uv-btn ${stats.uvMode ? "uv-active" : ""}`}
                  onClick={() => handleVirtualAction("uv")}
                  title="පාරජම්බුල (UV) කිරණ ක්‍රියාත්මක කරන්න [U]"
                >
                  <Icons.UV className="tactical-svg-icon" /> {stats.uvMode ? "UV ON" : "UV OFF"}
                </button>
              )}
              <button
                className="tactical-cam-btn"
                onClick={() => handleVirtualAction("camera")}
                title="කැමරාවෙන් ඡායාරූපයක් ගන්න [C]"
              >
                <Icons.Camera className="tactical-svg-icon" /> SNAP
              </button>
              <button
                className="tactical-zoom-btn"
                onClick={() => handleVirtualAction("zoom")}
                title="දුරදක්නය / Zoom [Z]"
              >
                <Icons.Zoom className="tactical-svg-icon" /> {stats.zoom < 0.95 ? "1.0x" : "WIDE"}
              </button>
              <button
                className={`tactical-hud-btn ${isImmersiveHud ? "hud-hidden" : ""}`}
                onClick={() => handleVirtualAction("hud")}
                title="HUD දර්ශනය පාලනය කරන්න [V]"
              >
                <Icons.Eye className="tactical-svg-icon" /> HUD
              </button>
              <button
                className={`tactical-audio-btn ${isMuted ? "muted" : ""}`}
                onClick={toggleMute}
                title="ශබ්ද පාලනය"
              >
                {isMuted ? <Icons.AudioMute className="tactical-svg-icon" /> : <Icons.AudioOn className="tactical-svg-icon" />}
              </button>
              <button
                className="tactical-hud-btn tactical-quality-btn"
                onClick={() => handleVirtualAction("quality")}
                title="ග්‍රැෆික් මට්ටම / Graphics Quality [O] (High / Medium / Low)"
              >
                <Icons.Settings className="tactical-svg-icon" /> {(stats.quality || "HIGH").toUpperCase()}
              </button>
              <button
                className="tactical-lang-btn"
                onClick={toggleLanguage}
                title="භාෂාව මාරු කරන්න / Switch Language"
              >
                🌐 {lang.toUpperCase()}
              </button>
              <button
                className="tactical-fullscreen-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? I18N[lang].exit_fullscreen : I18N[lang].fullscreen}
              >
                <Icons.Zoom className="tactical-svg-icon" /> {isFullscreen ? "EXIT FS" : "FULL"}
              </button>
              <button
                className="tactical-map-btn"
                onClick={() => {
                  if (engineRef.current) engineRef.current.playSfx("pda_open");
                  setShowTacticalMap(true);
                }}
                title="සිතියම [M]"
              >
                <Icons.Map className="tactical-svg-icon" /> MAP
              </button>
              <button className="tactical-pause-btn" onClick={togglePause}>
                <Icons.Pause className="tactical-svg-icon" /> ESC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Left Side Floating Mission Objective HUD ── */}
      {!isImmersiveHud && (
      <div className="tactical-mission-panel">
        <div className="mission-panel-header">
          <span className="mission-badge">ACTIVE OP</span>
          <span className="mission-chap-title">CHAPTER 0{activeChapter}</span>
        </div>
        <div className="evidence-counter-strip">
          <span>සාක්ෂි ප්‍රගතිය:</span>
          <span className="counter-val">{currentChapterEvidenceCount} / 3</span>
        </div>

        {activeChapter === 2 ? (
          <ul className="mission-checklist">
            <li className={stats.tasks?.mapFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.mapFound ? "✓" : "○"}</span>
              <span>භූවිද්‍යා සිතියම සොයාගන්න</span>
            </li>
            <li className={stats.hasGears || stats.cableRepaired ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.hasGears || stats.cableRepaired ? "✓" : "○"}</span>
              <span>කේබල් කරත්ත ගියර් (Gears) සොයාගන්න</span>
            </li>
            <li className={stats.tasks?.raftUsed || stats.tasks?.cableUsed ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.raftUsed || stats.tasks?.cableUsed ? "✓" : "○"}</span>
              <span>පහුරෙන් හෝ කේබල් කරත්තයෙන් එතෙර වන්න</span>
            </li>
            <li className={stats.tasks?.tapeFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.tapeFound ? "✓" : "○"}</span>
              <span>දියඇල්ලේ කැසට් පටිය (Tape) අසන්න</span>
            </li>
            <li className={stats.tasks?.gemFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.gemFound ? "✓" : "○"}</span>
              <span>මයිකා පතලේ නිල් ස්ඵටිකය ලබාගන්න</span>
            </li>
            <li className={stats.tasks?.towerReached ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.towerReached ? "✓" : "○"}</span>
              <span>කඳු මුදුනේ සංඥා කුලුන දල්වන්න</span>
            </li>
          </ul>
        ) : activeChapter === 3 ? (
          <ul className="mission-checklist">
            <li className={stats.tasks?.slateFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.slateFound ? "✓" : "○"}</span>
              <span>පුරාණ ශිලා ලේඛනය කියවන්න</span>
            </li>
            <li className={stats.tasks?.maskFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.maskFound ? "✓" : "○"}</span>
              <span>වායු මුහුණු ආවරණය (Gas Mask) පළඳින්න</span>
            </li>
            <li className={stats.tasks?.floodgateUsed ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.floodgateUsed ? "✓" : "○"}</span>
              <span>සොරොව්ව හරවා ජලය බැස්සවීම</span>
            </li>
            <li className={stats.tasks?.coreFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.coreFound ? "✓" : "○"}</span>
              <span>ප්‍රතිදීප්ත අගාධ පාෂාණය ලබාගන්න</span>
            </li>
            <li className={stats.tasks?.logFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.logFound ? "✓" : "○"}</span>
              <span>පතල් කම්කරු සටහන පරීක්ෂා කරන්න</span>
            </li>
            <li className={stats.tasks?.elevatorReached ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.elevatorReached ? "✓" : "○"}</span>
              <span>භූගත එසවුම් ලිෆ්ට් එක ක්‍රියාත්මක කරන්න</span>
            </li>
          </ul>
        ) : activeChapter === 4 ? (
          <ul className="mission-checklist">
            <li className={stats.tasks?.generatorFixed ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.generatorFixed ? "✓" : "○"}</span>
              <span>ප්‍රධාන ජෙනරේටරය පණගන්වන්න</span>
            </li>
            <li className={stats.tasks?.docsFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.docsFound ? "✓" : "○"}</span>
              <span>පරිගණක ලිපිගොනු කියවන්න</span>
            </li>
            <li className={stats.tasks?.breakerPulled ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.breakerPulled ? "✓" : "○"}</span>
              <span>විදුලි විසන්ධිකාරකය (Breaker) ක්‍රියාවිරහිත කරන්න</span>
            </li>
            <li className={stats.tasks?.keycardFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.keycardFound ? "✓" : "○"}</span>
              <span>Level 3 ප්‍රවේශ කාඩ්පත ලබාගන්න</span>
            </li>
            <li className={stats.tasks?.dnaFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.dnaFound ? "✓" : "○"}</span>
              <span>ක්‍රයෝ-කුටියෙන් DNA සාම්පලය ගන්න</span>
            </li>
            <li className={stats.tasks?.monorailReached ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.monorailReached ? "✓" : "○"}</span>
              <span>වියන් මොනොරේල් වායු අගුළුවට යන්න</span>
            </li>
          </ul>
        ) : activeChapter === 5 ? (
          <ul className="mission-checklist">
            <li className={stats.tasks?.blackboxFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.blackboxFound ? "✓" : "○"}</span>
              <span>ගවේෂණ කළු පෙට්ටිය ලබාගන්න</span>
            </li>
            <li className={stats.tasks?.bridgeCrossed ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.bridgeCrossed ? "✓" : "○"}</span>
              <span>සුළඟට පැද්දෙන ලණු පාලම තරණය කරන්න</span>
            </li>
            <li className={stats.tasks?.truthFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.truthFound ? "✓" : "○"}</span>
              <span>ඩග්ලස්ගේ අවසාන පාපොච්චාරණය කියවන්න</span>
            </li>
            <li className={stats.tasks?.beaconActivated ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.beaconActivated ? "✓" : "○"}</span>
              <span>සැටලයිට් ඇන්ටනාව පෙළගස්වන්න</span>
            </li>
            <li className={stats.tasks?.skyhookReached ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.skyhookReached ? "✓" : "○"}</span>
              <span>මහා නාවෘක්ෂ මුරකුළුණෙන් ගැලවුම් යානය අමතන්න</span>
            </li>
          </ul>
        ) : (
          <ul className="mission-checklist">
            <li className={stats.tasks?.diaryFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.diaryFound ? "✓" : "○"}</span>
              <span>මුරපොළේ දිනපොත කියවන්න</span>
            </li>
            <li className={stats.tasks?.keyFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.keyFound ? "✓" : "○"}</span>
              <span>පුරාණ පිත්තල යතුර සොයාගන්න</span>
            </li>
            <li className={stats.tasks?.sampleFound ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.sampleFound ? "✓" : "○"}</span>
              <span>පර්යේෂණ සාම්පලය අහුලාගන්න</span>
            </li>
            <li className={stats.tasks?.helipadReached ? "task-complete" : "task-active"}>
              <span className="check-box">{stats.tasks?.helipadReached ? "✓" : "○"}</span>
              <span>හෙලිකොප්ටර් කලාපයට යන්න</span>
            </li>
          </ul>
        )}
      </div>
      )}

      {/* Friendly Explorer Onboarding Tip */}
      {showOnboardingTip && (
        <div className="game-onboarding-tip">
          <div className="onboarding-tip-header">
            <span><Icons.Target className="tactical-svg-icon" /> ගවේෂක උපදෙස් (FIELD INTEL)</span>
            <button className="tip-close-btn" onClick={() => setShowOnboardingTip(false)}>✕</button>
          </div>
          <p>
            <strong>WASD / ඊතල</strong> හෝ තිරය මත <strong>ක්ලික් කර</strong> ඇවිදින්න. <br />
            ගිනිමැලය අසල <strong>[T]</strong> ඔබා ඔසුපැන් පෙරන්න | <strong>[Z]</strong> ඔබා Zoom කරන්න | මඟ පෙන්වුම් පුවරු අනුගමනය කරන්න!
          </p>
        </div>
      )}

      {/* Tea Buff Active Indicator */}
      {stats.teaBuffTimer > 0 && (
        <div className="tea-buff-badge">
          <Icons.Tea className="tactical-svg-icon" /> ඔසුපැන් ශක්තිය: {stats.teaBuffTimer}s (Stamina ∞ | Health Regen)
        </div>
      )}

      {/* Leech Repellent Balm Active Indicator */}
      {stats.repellentTimer > 0 && (
        <div className="repellent-buff-badge">
          <Icons.Balm className="tactical-svg-icon" /> කූඩැලි ආරක්ෂාව: {stats.repellentTimer}s (Leeches Repelled)
        </div>
      )}

      {/* Magpie Charm Active Indicator */}
      {stats.magpieCharmActive && (
        <div className="charm-buff-badge">
          <Icons.Feather className="tactical-svg-icon" /> කැහිබෙලි ආමුදිතය: වේගය +20% & නොනවතින ශක්තිය (Active)
        </div>
      )}

      {/* Tropical Rainstorm Warning Indicator */}
      {stats.stormActive && (
        <div className="storm-alert-badge">
          <Icons.Warning className="tactical-svg-icon" /> වැසි කුණාටුව සක්‍රියයි! යෝධ ගස් කොටන් පාලම (Log Bridge) ඔස්සේ එතෙර වන්න!
        </div>
      )}

      {/* Shelter Protection Badge */}
      {stats.inShelter && (
        <div className="shelter-buff-badge">
          <Icons.Shield className="tactical-svg-icon" /> මුරපොළ කුටිය: වැස්සෙන් ආරක්ෂිතයි (Sanity & Battery ආරෝපණය වේ)
        </div>
      )}

      {/* Mud Slowdown Alert */}
      {stats.inMud && (
        <div className="mud-alert-badge">
          <Icons.Warning className="tactical-svg-icon" /> මඩ වගුර: වේගය අඩු වී ඇත! (ගස් පාලම ඔස්සේ යන්න)
        </div>
      )}

      {/* Chapter 2 Hypothermia Alert Badge */}
      {(stats.chapter === 2 || activeChapter === 2) && (stats.temperature ?? 100) < 35 && (
        <button
          className="hypothermia-alert-badge"
          onClick={() => handleVirtualAction("gingertea")}
          title="ඉඟුරු තේ පානය කර ශරීරය උණුසුම් කරගන්න [G]"
        >
          <Icons.Snowflake className="tactical-svg-icon" /> දැඩි ශීතල අනතුර (Hypothermia)! [G] ඔබා ඉඟුරු තේ පානය කරන්න හෝ උණුදිය උල්පතට යන්න!
        </button>
      )}

      {/* Campfire Warmth & Quick-Brew Action */}
      {stats.nearCampfire && (
        <div className="campfire-actions-container">
          <div className="campfire-safe-badge">
            <Icons.Flame className="tactical-svg-icon" /> ගිනිමැලය අසල: Health & Sanity සුවපත් වෙමින් පවතී
          </div>
          {stats.herbCount > 0 && (
            <button
              className="campfire-brew-btn"
              onClick={() => handleVirtualAction("tea")}
              title="ඖෂධ 1ක් වැය කර ඔසුපැන් පෙරන්න"
            >
              <Icons.Tea className="tactical-svg-icon" /> ඔසුපැන් පෙරන්න [T] (+25 HP, +35 SAN, 60s Buff)
            </button>
          )}
        </div>
      )}

      {/* Danger Bleeding Alert (Clickable for instant cure) */}
      {stats.bleeding && (
        <button
          className="bleeding-alert-action-btn"
          onClick={() => handleVirtualAction("salt")}
          title="කූඩැල්ලා ඉවත් කිරීමට මෙතන ඔබන්න"
        >
          <Icons.Heart className="tactical-svg-icon" /> කූඩැල්ලා එල්ලී ඇත! [ ලුණු දැමීම - මෙතන ඔබන්න හෝ SPACE ]
        </button>
      )}

      {/* Toast Notification */}
      {toastMsg && <div className="game-toast-floating">{toastMsg}</div>}

      {/* ── Cinematic Letterbox Dialogue Box with Character Portrait ── */}
      {dialogue && (
        <div className="cinematic-dialogue-screen" onClick={() => setDialogue(null)}>
          <div className="letterbox-bar top-bar" />
          <div className="cinematic-dialogue-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dialogue-avatar-frame">
              <span className="dialogue-avatar-icon">
                {Icons[dialogue.avatar] ? React.createElement(Icons[dialogue.avatar], { className: "tactical-svg-icon" }) : <Icons.Radio className="tactical-svg-icon" />}
              </span>
            </div>
            <div className="dialogue-text-wrap">
              <div className="dialogue-speaker-tag">
                {lang === "en" ? (dialogue.speakerEn || dialogue.speaker || "EXPEDITION LOG // 1987") : (dialogue.speaker || "ගවේෂණ සටහන // LOG")}
              </div>
              <h2 className="dialogue-scene-title">{lang === "en" ? (dialogue.titleEn || dialogue.title) : dialogue.title}</h2>
              <p className="dialogue-paragraph">{lang === "en" ? (dialogue.textEn || dialogue.text) : dialogue.text}</p>
              {dialogue.item && (
                <div className="dialogue-item-reward">
                  <Icons.Target className="tactical-svg-icon" /> {lang === "en" ? "ITEM ACQUIRED: " : "අයිතමය ලැබුණි: "}<strong>{lang === "en" ? (dialogue.itemEn || dialogue.item) : dialogue.item}</strong>
                </div>
              )}
              <button className="dialogue-advance-btn" onClick={() => setDialogue(null)}>
                {lang === "en" ? "CONTINUE [SPACE / ESC]" : "ඉදිරියට යන්න (CONTINUE) [SPACE]"}
              </button>
            </div>
          </div>
          <div className="letterbox-bar bottom-bar" />
        </div>
      )}

      {/* ── Interactive Rune Dial Lock Puzzle Modal ── */}
      {runePuzzleOpen && (
        <div className="rune-puzzle-overlay">
          <div className="rune-puzzle-card">
            <div className="puzzle-header">
              <h2><Icons.Target className="tactical-svg-icon" /> {lang === "en" ? "Ancient Monolith Rune Dial Lock" : "පුරාණ සිංහරාජ ගල් ලෙන් දොරටුවේ රහස් කේතය"}</h2>
              <button className="close-btn" onClick={() => setRunePuzzleOpen(false)}>✕</button>
            </div>
            <p className="puzzle-hint-text">
              {lang === "en" ? "Align the 3 secret runes noted in Douglas's journal:" : "දිනපොතේ සඳහන් වූ රහස් සංකේත 3 ගලපන්න:"}<br />
              <em>{lang === "en" ? "“At dawn as the Sun rises... across the River... enter the Lion's sanctuary...”" : "“හිරු නැගෙන හෝරාවේ... ගංගාවෙන් එතෙර වී... සිංහයාගේ ලෙනට...”"}</em>
            </p>
            <div className="puzzle-diary-clue-pill">
              <Icons.Book className="tactical-svg-icon" /> {lang === "en" ? "Journal Clue: " : "දිනපොතේ හෝඩුවාව: "}<strong>{lang === "en" ? "1. SUN | 2. RIVER | 3. LION" : "1. SUN (සූර්යයා) | 2. RIVER (ගංගාව) | 3. LION (සිංහයා)"}</strong>
            </div>

            <div className="rune-dials-row">
              <div className="dial-box">
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(1, -1)}
                >
                  ▲
                </button>
                <div className="dial-value">{DIAL_1_OPTIONS[dial1]}</div>
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(1, 1)}
                >
                  ▼
                </button>
              </div>

              <div className="dial-box">
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(2, -1)}
                >
                  ▲
                </button>
                <div className="dial-value">{DIAL_2_OPTIONS[dial2]}</div>
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(2, 1)}
                >
                  ▼
                </button>
              </div>

              <div className="dial-box">
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(3, -1)}
                >
                  ▲
                </button>
                <div className="dial-value">{DIAL_3_OPTIONS[dial3]}</div>
                <button
                  className="dial-arrow"
                  onClick={() => handleDialTurn(3, 1)}
                >
                  ▼
                </button>
              </div>
            </div>

            {puzzleError && <div className="puzzle-error-alert">{puzzleError}</div>}

            <button className="start-btn unlock-gate-btn" onClick={handleRuneSubmit}>
              <Icons.Unlock className="tactical-svg-icon" /> {lang === "en" ? "UNLOCK MONOLITH GATE" : "දොර අගුළු හරින්න (UNLOCK GATE)"}
            </button>
          </div>
        </div>
      )}

      {/* ── ESC Tactical Pause Menu Modal & Settings ── */}
      {isPaused && (
        <div className="tactical-pause-overlay">
          <div className="tactical-pause-modal">
            <h1 className="pause-title">{I18N[lang].mission_paused}</h1>
            <p className="pause-subtitle">{I18N[lang].expedition_overview}</p>

            {/* In-Game Audio, Controls & Language Settings */}
            <div className="pause-settings-panel">
              <div className="setting-row">
                <span><Icons.AudioOn className="tactical-svg-icon" /> {I18N[lang].audio_status}</span>
                <button
                  className={`settings-toggle-btn ${isMuted ? "off" : "on"}`}
                  onClick={toggleMute}
                >
                  {isMuted ? I18N[lang].audio_muted : I18N[lang].audio_on}
                </button>
              </div>
              <div className="setting-row">
                <span><Icons.Compass className="tactical-svg-icon" /> {I18N[lang].language_select}</span>
                <button
                  className="settings-toggle-btn lang-toggle-btn"
                  onClick={toggleLanguage}
                >
                  {lang === "en" ? "🇬🇧 ENGLISH" : "🇱🇰 සිංහල"}
                </button>
              </div>
              <div className="setting-row">
                <span><Icons.Target className="tactical-svg-icon" /> {I18N[lang].touch_controls}</span>
                <button
                  className="settings-toggle-btn"
                  onClick={toggleControlScheme}
                >
                  {controlScheme === "joystick" ? I18N[lang].controls_joystick : I18N[lang].controls_dpad}
                </button>
              </div>
              <div className="setting-row">
                <span><Icons.Zoom className="tactical-svg-icon" /> {I18N[lang].fullscreen}:</span>
                <button
                  className="settings-toggle-btn"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? I18N[lang].exit_fullscreen : I18N[lang].fullscreen}
                </button>
              </div>
              <div className="setting-row">
                <span><Icons.Zoom className="tactical-svg-icon" /> {I18N[lang].camera_view}</span>
                <button
                  className="settings-toggle-btn"
                  onClick={() => handleVirtualAction("zoom")}
                >
                  {stats.zoom < 0.95 ? I18N[lang].cam_wide : I18N[lang].cam_normal}
                </button>
              </div>
              <div className="setting-row">
                <span><Icons.Shield className="tactical-svg-icon" /> {I18N[lang].survival_difficulty}</span>
                <button
                  className={`settings-toggle-btn difficulty-toggle-btn ${stats.difficulty === "hardcore" ? "diff-hardcore" : "diff-tactical"}`}
                  onClick={() => {
                    const nextDiff = stats.difficulty === "hardcore" ? "tactical" : "hardcore";
                    if (engineRef.current) engineRef.current.setDifficulty(nextDiff);
                  }}
                >
                  {stats.difficulty === "hardcore" ? I18N[lang].difficulty_hardcore : I18N[lang].difficulty_tactical}
                </button>
              </div>
            </div>

            <div className="pause-menu-actions">
              <button className="pause-menu-btn resume-btn" onClick={togglePause}>
                {I18N[lang].resume}
              </button>
              <button className="pause-menu-btn" onClick={() => setShowEvidenceBoard(true)}>
                <Icons.Evidence className="tactical-svg-icon" /> {I18N[lang].evidence_board}
              </button>
              <button className="pause-menu-btn" onClick={() => setShowTrophies(true)}>
                <Icons.Trophy className="tactical-svg-icon" /> {I18N[lang].achievements}
              </button>
              <button className="pause-menu-btn" onClick={() => setShowJournal(true)}>
                <Icons.Journal className="tactical-svg-icon" /> {I18N[lang].field_guide}
              </button>
              <button className="pause-menu-btn" onClick={() => setShowControlsGuide(true)}>
                <Icons.Keyboard className="tactical-svg-icon" /> {I18N[lang].controls_guide}
              </button>
              <button className="pause-menu-btn" onClick={() => launchChapter(activeChapter)}>
                <Icons.Restart className="tactical-svg-icon" /> {I18N[lang].restart_mission}
              </button>
              <button className="pause-menu-btn quit-btn" onClick={() => setCurrentView("chapters")}>
                <Icons.Exit className="tactical-svg-icon" /> {I18N[lang].quit_to_menu}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Guide Modal */}
      {showControlsGuide && (
        <div className="controls-guide-modal" onClick={() => setShowControlsGuide(false)}>
          <div className="controls-guide-card" onClick={(e) => e.stopPropagation()}>
            <div className="guide-header">
              <h2><Icons.Keyboard className="tactical-svg-icon" /> KEYBOARD & MOUSE CONTROLS</h2>
              <button className="close-btn" onClick={() => setShowControlsGuide(false)}>✕</button>
            </div>
            <div className="guide-grid">
              <div className="guide-row"><span className="kbd">W A S D / ඊතල</span><span>ඇවිදීම (Move Explorer)</span></div>
              <div className="guide-row"><span className="kbd">SHIFT</span><span>වේගයෙන් දිවීම (Sprint)</span></div>
              <div className="guide-row"><span className="kbd">1 / SPACE</span><span>කූඩැල්ලන්ට ලුණු දැමීම (Throw Salt)</span></div>
              <div className="guide-row"><span className="kbd">2 / H</span><span>ඖෂධ භාවිතය / විෂ නාශනය (Heal & Antivenom)</span></div>
              <div className="guide-row"><span className="kbd">R</span><span>හෑන්ඩ්-ක්‍රෑන්ක් ඩයිනමෝවෙන් ආරෝපණය (Crank Dynamo +14% Battery)</span></div>
              <div className="guide-row"><span className="kbd">B</span><span>කූඩැලි ආලේපනය (Leech Balm 90s Buff)</span></div>
              <div className="guide-row"><span className="kbd">T</span><span>ගිනිමැලය අසල ඔසුපැන් පෙරීම (Brew Tea)</span></div>
              <div className="guide-row"><span className="kbd">G</span><span>ඉඟුරු තේ පානය (Ginger Tea / Warmth +40%)</span></div>
              <div className="guide-row"><span className="kbd">C</span><span>ක්ෂේත්‍ර කැමරාව (Wildlife Camera Snapshot)</span></div>
              <div className="guide-row"><span className="kbd">U</span><span>පාරජම්බුල කිරණ (UV Blacklight Mode)</span></div>
              <div className="guide-row"><span className="kbd">Z</span><span>දුරදක්න කැමරාව (Binoculars Zoom)</span></div>
              <div className="guide-row"><span className="kbd">3 / F</span><span>විදුලි පන්දම (Flashlight On/Off)</span></div>
              <div className="guide-row"><span className="kbd">4 / E</span><span>පරීක්ෂාව / ඇරීම (Interact)</span></div>
              <div className="guide-row"><span className="kbd">M</span><span>සිතියම (Tactical Map)</span></div>
              <div className="guide-row"><span className="kbd">I</span><span>බඩු මල්ල (Inventory Backpack)</span></div>
              <div className="guide-row"><span className="kbd">ESC</span><span>Pause Menu</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Diegetic In-World [E] Interact Prompt ── */}
      {stats.nearInteractable && (
        <div
          className="diegetic-interact-prompt animate-pulse-bounce"
          onClick={() => handleVirtualAction("interact")}
          title="ක්‍රියාත්මක කරන්න [E]"
        >
          <span className="interact-key-pill">[E]</span>
          <span className="interact-icon"><Icons.Inspect className="tactical-svg-icon" /></span>
          <div className="interact-details">
            <span className="interact-title">{stats.nearInteractable.title}</span>
            <span className="interact-action">{stats.nearInteractable.prompt || "පරීක්ෂා කරන්න (INTERACT)"}</span>
          </div>
          <span className="interact-arrow">▶</span>
        </div>
      )}

      {/* ── Bottom Tactical Quick-Action Belt ── */}
      <div className="tactical-action-belt">
        <div className="belt-slot" onClick={() => handleVirtualAction("salt")}>
          <span className="belt-hotkey">[1]</span>
          <span className="belt-icon"><Icons.Salt className="tactical-svg-icon" /></span>
          <span className="belt-tag">{I18N[lang].salt} ({stats.saltCount})</span>
        </div>

        <div
          className={`belt-slot ${stats.herbCount > 0 ? "" : "slot-empty"}`}
          onClick={() => handleVirtualAction("herb")}
        >
          <span className="belt-hotkey">[2]</span>
          <span className="belt-icon"><Icons.Herb className="tactical-svg-icon" /></span>
          <span className="belt-tag">{I18N[lang].herb} ({stats.herbCount})</span>
        </div>

        <div
          className={`belt-slot ${stats.balmCount > 0 ? "" : "slot-empty"} ${stats.repellentTimer > 0 ? "highlight-tea" : ""}`}
          onClick={() => handleVirtualAction("balm")}
          title="කූඩැලි විකර්ෂක ආලේපනය [B]"
        >
          <span className="belt-hotkey">[B]</span>
          <span className="belt-icon"><Icons.Balm className="tactical-svg-icon" /></span>
          <span className="belt-tag">{I18N[lang].balm} ({stats.balmCount})</span>
        </div>

        <div
          className={`belt-slot ${stats.nearCampfire && stats.herbCount > 0 ? "highlight-tea" : ""}`}
          onClick={() => handleVirtualAction("tea")}
          title="ගිනිමැලය අසල ඔසුපැන් පෙරන්න"
        >
          <span className="belt-hotkey">[T]</span>
          <span className="belt-icon"><Icons.Tea className="tactical-svg-icon" /></span>
          <span className="belt-tag">{I18N[lang].tea}</span>
        </div>

        {(stats.chapter === 2 || activeChapter === 2) && (
          <div
            className={`belt-slot ${(stats.gingerTeaCount || 0) > 0 ? "" : "slot-empty"} ${(stats.temperature ?? 100) < 40 ? "highlight-cold" : ""}`}
            onClick={() => handleVirtualAction("gingertea")}
            title="ඉඟුරු තේ පානය කර ශරීරය උණුසුම් කරන්න [G]"
          >
            <span className="belt-hotkey">[G]</span>
            <span className="belt-icon"><Icons.GingerTea className="tactical-svg-icon" /></span>
            <span className="belt-tag">{I18N[lang].ginger_tea} ({stats.gingerTeaCount || 0})</span>
          </div>
        )}

        <div
          className="belt-slot"
          onClick={() => handleVirtualAction("camera")}
          title="ක්ෂේත්‍ර කැමරාවෙන් ඡායාරූපයක් ගන්න [C]"
        >
          <span className="belt-hotkey">[C]</span>
          <span className="belt-icon"><Icons.Camera className="tactical-svg-icon" /></span>
          <span className="belt-tag">{I18N[lang].camera} ({capturedPhotos.length})</span>
        </div>

        {stats.uvUnlocked && (
          <div
            className={`belt-slot ${stats.uvMode ? "belt-uv-on" : ""}`}
            onClick={() => handleVirtualAction("uv")}
            title="පාරජම්බුල (UV) කිරණ ක්‍රියාත්මක කරන්න [U]"
          >
            <span className="belt-hotkey">[U]</span>
            <span className="belt-icon"><Icons.UV className="tactical-svg-icon" /></span>
            <span className="belt-tag">{stats.uvMode ? "UV ON" : "UV OFF"}</span>
          </div>
        )}

        {activeChapter === 2 ? (
          <div
            className={`belt-slot ${stats.hasEmf ? "highlight-cold" : "slot-empty"}`}
            onClick={() => handleVirtualAction("interact")}
            title="විද්‍යුත් චුම්භක අනාවරකය (EMF Detector)"
          >
            <span className="belt-hotkey">[3]</span>
            <span className="belt-icon"><Icons.EMF className="tactical-svg-icon" /></span>
            <span className="belt-tag">EMF {Math.round((stats.emfProximity || 0) * 100)}%</span>
          </div>
        ) : (
          <div
            className={`belt-slot ${stats.torchOn ? "belt-torch-on" : ""}`}
            onClick={() => handleVirtualAction("torch")}
          >
            <span className="belt-hotkey">[3]</span>
            <span className="belt-icon"><Icons.Torch className="tactical-svg-icon" /></span>
            <span className="belt-tag">{stats.torchOn ? I18N[lang].torch_on : I18N[lang].torch_off}</span>
          </div>
        )}

        <div
          className={`belt-slot ${stats.battery < 25 ? "highlight-dynamo" : ""}`}
          onClick={() => handleVirtualAction("crank")}
          title="හෑන්ඩ්-ක්‍රෑන්ක් ඩයිනමෝවෙන් ආරෝපණය කරන්න [R]"
        >
          <span className="belt-hotkey">[R]</span>
          <span className="belt-icon"><Icons.Crank className="tactical-svg-icon" /></span>
          <span className="belt-tag">CRANK ({stats.battery}%)</span>
        </div>

        <div className="belt-slot" onClick={() => handleVirtualAction("interact")}>
          <span className="belt-hotkey">[4]</span>
          <span className="belt-icon"><Icons.Inspect className="tactical-svg-icon" /></span>
          <span className="belt-tag">{I18N[lang].interact}</span>
        </div>

        <div className="belt-slot" onClick={() => handleVirtualAction("zoom")}>
          <span className="belt-hotkey">[Z]</span>
          <span className="belt-icon"><Icons.Zoom className="tactical-svg-icon" /></span>
          <span className="belt-tag">{I18N[lang].zoom}</span>
        </div>

        <div
          className={`belt-slot ${stats.viewMode === "fps" ? "belt-fps-active" : ""}`}
          onClick={() => handleVirtualAction("viewMode")}
          title="දසුන වෙනස් කරන්න (1st Person IGI / 2.5D Isometric) [V]"
        >
          <span className="belt-hotkey">[V]</span>
          <span className="belt-icon"><Icons.Crosshair className="tactical-svg-icon" /></span>
          <span className="belt-tag">{stats.viewMode === "fps" ? "1ST PERSON" : "2.5D VIEW"}</span>
        </div>

        <div className="belt-slot" onClick={() => setShowEvidenceBoard(true)}>
          <span className="belt-hotkey">[5]</span>
          <span className="belt-icon"><Icons.Evidence className="tactical-svg-icon" /></span>
          <span className="belt-tag">{I18N[lang].evidence} ({currentChapterEvidenceCount}/3)</span>
        </div>

        <div
          className="belt-slot"
          onClick={() => {
            if (engineRef.current) engineRef.current.playSfx("pda_open");
            setShowTacticalMap(true);
          }}
        >
          <span className="belt-hotkey">[M]</span>
          <span className="belt-icon"><Icons.Map className="tactical-svg-icon" /></span>
          <span className="belt-tag">{I18N[lang].map}</span>
        </div>

        <div
          className="belt-slot"
          onClick={() => {
            if (engineRef.current) engineRef.current.playSfx("pda_open");
            setShowInventory(true);
          }}
        >
          <span className="belt-hotkey">[I]</span>
          <span className="belt-icon"><Icons.Backpack className="tactical-svg-icon" /></span>
          <span className="belt-tag">{I18N[lang].bag}</span>
        </div>
      </div>

      {/* Evidence Board Modal while Playing */}
      {showEvidenceBoard && (
        <div className="evidence-modal" onClick={() => setShowEvidenceBoard(false)}>
          <div className="evidence-board" onClick={(e) => e.stopPropagation()}>
            <div className="board-header">
              <h2><Icons.Evidence className="tactical-svg-icon" /> සිංහරාජ රහස් සාක්ෂි පුවරුව (EVIDENCE CASE BOARD)</h2>
              <button className="close-btn" onClick={() => setShowEvidenceBoard(false)}>✕</button>
            </div>

            <div className="case-progress-wrap">
              <span>වත්මන් පරිච්ඡේදයේ ප්‍රගතිය:</span>
              <div className="case-progress-bar">
                <div
                  className="case-progress-fill"
                  style={{ width: `${(currentChapterEvidenceCount / 3) * 100}%` }}
                />
              </div>
              <span>{currentChapterEvidenceCount} / 3 සාක්ෂි හමුවී ඇත</span>
            </div>

            {activeChapter === 2 ? (
              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.map2 ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon"><Icons.Map className="tactical-svg-icon" /></div>
                  <h3>භූවිද්‍යාඥයින්ගේ සිතියම</h3>
                  <p>
                    {evidence.map2
                      ? "දියඇලි නිම්නය හරහා උණ බම්බු පහුරෙන් ගමන් කරන මාර්ගය සහ රහස් පතලේ පිවිසුම සලකුණු කර ඇත."
                      : "තවමත් හමුවී නැත. භූවිද්‍යා කඳවුරේ මේසය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.map2 ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.tape ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon"><Icons.Tape className="tactical-svg-icon" /></div>
                  <h3>පටිගත කළ හඬපටය</h3>
                  <p>
                    {evidence.tape
                      ? "අතුරුදහන් වූ ගවේෂකයන්ගේ අවසාන හඬ පණිවිඩය: 'කඳු මුදුනේ මුරකුළුණෙන් සංඥා කරන්න!'"
                      : "තවමත් හමුවී නැත. දියඇල්ල අසල ගල්පර පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.tape ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.gem ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon"><Icons.Crystal className="tactical-svg-icon" /></div>
                  <h3>නිල් ස්ඵටික සාම්පලය</h3>
                  <p>
                    {evidence.gem
                      ? "පැරණි පතල ඇතුළතින් සොයාගත් නිල් ආලෝකය විහිදුවන අභිරහස් ස්ඵටිකය."
                      : "තවමත් හමුවී නැත. පතල් කුහරය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.gem ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>
            ) : activeChapter === 3 ? (
              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.ch3_slate ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon"><Icons.Scroll className="tactical-svg-icon" /></div>
                  <h3>ප්‍රාග් ඓතිහාසික ශිලා ලේඛනය</h3>
                  <p>
                    {evidence.ch3_slate
                      ? "පුරාණ ලෙන් කුටියේ තිබූ සොරොව්ව සහ ගිලීගිය ශුද්ධ භූමිය පිළිබඳ සටහන්."
                      : "තවමත් හමුවී නැත. ලෙන් පිවිසුම අසල පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch3_slate ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch3_core ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon"><Icons.Orb className="tactical-svg-icon" /></div>
                  <h3>ප්‍රතිදීප්ත අගාධ පාෂාණය</h3>
                  <p>
                    {evidence.ch3_core
                      ? "ගිලීගිය ලෙන් ශුද්ධ භූමියේ ජලය බැසයාමෙන් පසු හමුවූ දම් පැහැති දීප්තිමත් ස්ඵටිකය."
                      : "තවමත් හමුවී නැත. සොරොව්ව කරකවා ජලය බැස්සවීමෙන් පසු ලබාගන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch3_core ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch3_torch ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon"><Icons.Lantern className="tactical-svg-icon" /></div>
                  <h3>පතල් කම්කරු අවසාන සටහන</h3>
                  <p>
                    {evidence.ch3_torch
                      ? "1987 පතල් කම්කරුවන් අගාධයෙන් ඉහළ රහස් විද්‍යාගාරයට පිවිසි බව තහවුරු කරන ලිපිය."
                      : "තවමත් හමුවී නැත. අගාධ කෙළවර පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch3_torch ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>
            ) : activeChapter === 4 ? (
              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.ch4_docs ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon"><Icons.Folder className="tactical-svg-icon" /></div>
                  <h3>1987 රහස් ව්‍යාපෘති ලිපිගොනුව</h3>
                  <p>
                    {evidence.ch4_docs
                      ? "පරිගණක පර්යන්තයෙන් ලබාගත් රහස් ජෛව විද්‍යාත්මක පර්යේෂණ වාර්තාව."
                      : "තවමත් හමුවී නැත. ප්‍රධාන පරිගණකය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch4_docs ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch4_keycard ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon"><Icons.Keycard className="tactical-svg-icon" /></div>
                  <h3>Level 3 ප්‍රවේශ කාඩ්පත</h3>
                  <p>
                    {evidence.ch4_keycard
                      ? "ක්‍රයෝ-කුටිය සහ වියන් මොනොරේල් දොරටුව විවෘත කිරීමට හැකි ආරක්ෂක කාඩ්පත."
                      : "තවමත් හමුවී නැත. කාර්යාල මේසය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch4_keycard ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch4_sample ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon"><Icons.Dna className="tactical-svg-icon" /></div>
                  <h3>විකෘති DNA සාම්පලය</h3>
                  <p>
                    {evidence.ch4_sample
                      ? "වසර 30ක් ආරක්ෂිතව පැවති දුර්ලභ ශාක-සත්ව විකෘති ජෛව සාම්පලය."
                      : "තවමත් හමුවී නැත. ක්‍රයෝ-කුටිය විවෘත කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch4_sample ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>
            ) : activeChapter === 5 ? (
              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.ch5_blackbox ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon"><Icons.Box className="tactical-svg-icon" /></div>
                  <h3>ගවේෂණ කළු පෙට්ටිය (Blackbox)</h3>
                  <p>
                    {evidence.ch5_blackbox
                      ? "1987 හෙලිකොප්ටර් අනතුරේ සම්පූර්ණ ටෙලිමෙට්‍රි සහ සංවාද දත්ත අඩංගු ෆ්ලයිට් රෙකෝඩරය."
                      : "තවමත් හමුවී නැත. වියන් මාවත ආරම්භය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch5_blackbox ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch5_truth ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon"><Icons.Scroll className="tactical-svg-icon" /></div>
                  <h3>මහාචාර්ය ඩග්ලස්ගේ අවසාන පාපොච්චාරණය</h3>
                  <p>
                    {evidence.ch5_truth
                      ? "සිංහරාජයේ රහස සහ විකෘති ශාකයෙන් සුව කළ හැකි විශ්වීය ඖෂධීය සූත්‍රය."
                      : "තවමත් හමුවී නැත. වියන් කුටිය පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch5_truth ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.ch5_beacon ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon"><Icons.Satellite className="tactical-svg-icon" /></div>
                  <h3>සැටලයිට් බීකන සම්ප්‍රේෂණය</h3>
                  <p>
                    {evidence.ch5_beacon
                      ? "සත්‍යය මුළු ලොවටම ප්‍රචාරය කරමින් චන්ද්‍රිකාව හා සම්බන්ධ වූ සක්‍රිය බීකනය."
                      : "තවමත් පෙළගස්වා නැත. සැටලයිට් ඇන්ටනාව ක්‍රියාත්මක කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.ch5_beacon ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>
            ) : (
              <div className="evidence-cards-cluster">
                <div className={`evidence-polaroid ${evidence.diary ? "collected" : "uncollected"}`}>
                  <div className="pin-head red-pin" />
                  <div className="polaroid-icon"><Icons.Book className="tactical-svg-icon" /></div>
                  <h3>ලෙයින් පෙඟුණු දිනපොත</h3>
                  <p>
                    {evidence.diary
                      ? "1987 නොවැම්බර් 14: ඔවුන් ගල් ලෙන තුළට ගිය බවත් ලෙන් දොරටුවේ රහස් සංකේත [සූර්යයා, ගංගාව, සිංහයා] බවත් තහවුරු කරයි."
                      : "තවමත් හමුවී නැත. අතහැර දැමූ මුරපොළ පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.diary ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.key ? "collected" : "uncollected"}`}>
                  <div className="pin-head yellow-pin" />
                  <div className="polaroid-icon"><Icons.Key className="tactical-svg-icon" /></div>
                  <h3>පුරාණ පිත්තල යතුර</h3>
                  <p>
                    {evidence.key
                      ? "සිංහරාජයේ රහස් භූගත ලෙනේ අගුළු විවෘත කළ හැකි පැරණි පිත්තල යතුර."
                      : "තවමත් හමුවී නැත. ගංගා නිම්නයේ ඔරු තොට පරීක්ෂා කරන්න..."}
                  </p>
                  <span className="status-tag">{evidence.key ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>

                <div className={`evidence-polaroid ${evidence.sample ? "collected" : "uncollected"}`}>
                  <div className="pin-head blue-pin" />
                  <div className="polaroid-icon"><Icons.Vial className="tactical-svg-icon" /></div>
                  <h3>පර්යේෂණ සාම්පලය</h3>
                  <p>
                    {evidence.sample
                      ? "වසර 30ක් අතුරුදහන් වූ ගවේෂකයන්ගේ ප්‍රතිදීප්ත දිලීර අඩංගු අභිරහස් බඳුන."
                      : "තවමත් හමුවී නැත. අගුළු දැමූ ගල් ලෙන තුළ ඇත..."}
                  </p>
                  <span className="status-tag">{evidence.sample ? "✓ EVIDENCE VERIFIED" : "MISSING"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Field Journal Modal */}
      {showJournal && (
        <div className="journal-modal" onClick={() => setShowJournal(false)}>
          <div className="journal-content" onClick={(e) => e.stopPropagation()}>
            <div className="journal-header">
              <h2><Icons.Journal className="tactical-svg-icon" /> සිංහරාජ වනජීවී සටහන් සහ ඇල්බමය</h2>
              <button className="close-btn" onClick={() => setShowJournal(false)}>✕</button>
            </div>

            <div className="journal-tabs">
              <button
                className={`journal-tab-btn ${journalTab === "guide" ? "active" : ""}`}
                onClick={() => setJournalTab("guide")}
              >
                <Icons.Book className="tactical-svg-icon" /> වනජීවී සටහන් (FIELD GUIDE)
              </button>
              <button
                className={`journal-tab-btn ${journalTab === "photos" ? "active" : ""}`}
                onClick={() => setJournalTab("photos")}
              >
                <Icons.Camera className="tactical-svg-icon" /> ඡායාරූප ඇල්බමය ({capturedPhotos.length}/4)
              </button>
            </div>

            {journalTab === "guide" ? (
              <div className="journal-list">
                {journal.map((item, i) => (
                  <div key={i} className="journal-card">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="photo-gallery-grid">
                {capturedPhotos.length === 0 ? (
                  <div className="empty-gallery-box">
                    <span className="empty-cam-icon"><Icons.Camera className="tactical-svg-icon" /></span>
                    <p>තවමත් කිසිදු ඡායාරූපයක් ගෙන නොමැත.</p>
                    <small>කැලයේ සතුන් (කැහිබෙල්ලා, වඳුරන්, පොළඟා, කලාමැදිරියන්) අසලදී <strong>[C]</strong> ඔබා ඡායාරූප ගන්න!</small>
                  </div>
                ) : (
                  capturedPhotos.map((photo) => (
                    <div key={photo.id} className="polaroid-photo-item">
                      <div className="polaroid-img-preview">
                        <span className="polaroid-preview-icon"><Icons.Camera className="tactical-svg-icon" /></span>
                        <span className="polaroid-badge">FIELD PHOTO</span>
                      </div>
                      <div className="polaroid-item-info">
                        <h4>{photo.name}</h4>
                        <p>{photo.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trophies & Achievements Modal while Playing */}
      {showTrophies && (
        <div className="trophy-modal-overlay" onClick={() => setShowTrophies(false)}>
          <div className="trophy-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="trophy-modal-header">
              <h2><Icons.Trophy className="tactical-svg-icon" /> ගවේෂක සම්මාන සහ ජයග්‍රහණ (ACHIEVEMENTS)</h2>
              <button className="close-btn" onClick={() => setShowTrophies(false)}>✕</button>
            </div>
            <div className="trophies-grid">
              {MASTER_ACHIEVEMENTS.map((ach) => {
                const isAchieved = unlockedAchievements.includes(ach.id);
                return (
                  <div key={ach.id} className={`trophy-card ${isAchieved ? "unlocked" : "locked"}`}>
                    <div className="trophy-icon-wrap">
                      <span className="trophy-icon">
                        {Icons[ach.icon] ? React.createElement(Icons[ach.icon], { className: "tactical-svg-icon" }) : <Icons.Trophy className="tactical-svg-icon" />}
                      </span>
                      {isAchieved && <span className="trophy-check">✓</span>}
                    </div>
                    <div className="trophy-info">
                      <h3>{ach.nameSinhala}</h3>
                      <span className="trophy-en">{ach.nameEnglish}</span>
                      <p>{ach.desc}</p>
                      <span className={`trophy-status-tag ${isAchieved ? "status-done" : "status-lock"}`}>
                        {isAchieved ? "UNLOCKED [VERIFIED]" : "CLASSIFIED [LOCKED]"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Full Tactical Topographic Satellite Map PDA Modal [M] ── */}
      {showTacticalMap && (
        <div className="tactical-pda-modal-overlay" onClick={() => setShowTacticalMap(false)}>
          <div className="tactical-pda-device" onClick={(e) => e.stopPropagation()}>
            <div className="pda-frame-header">
              <div className="pda-branding">
                <span className="pda-mil-badge">MIL-SPEC PDA // MK-IV</span>
                <h3><Icons.Satellite className="tactical-svg-icon" /> {activeChapter === 2 ? "THE SILENT CASCADES SATELLITE MAP" : "KUDAWA SATELLITE MAP"}</h3>
              </div>
              <div className="pda-live-telemetry">
                <span>LAT: 6.405° N</span>
                <span>LON: 80.453° E</span>
                <span>ELEV: {activeChapter === 2 ? "620m" : "418m"}</span>
                <button
                  className="pda-close-btn"
                  onClick={() => {
                    if (engineRef.current) engineRef.current.playSfx("pda_close");
                    setShowTacticalMap(false);
                  }}
                >
                  ✕ CLOSE [M]
                </button>
              </div>
            </div>

            <div className="pda-screen-content">
              <div className="pda-map-viewport">
                <div className="satellite-topo-grid" />

                {activeChapter === 2 ? (
                  <>
                    {/* Chapter 2 River & Cascades */}
                    <div className="topo-river-band cascade-band" />
                    <div className="topo-zone-tag zone-kudawa" style={{ left: "10%", top: "20%" }}>
                      <span>[ENTRY] CASCADES ENTRY (පිවිසුම)</span>
                    </div>
                    <div className="topo-zone-tag zone-outpost" style={{ left: "28%", top: "26%" }}>
                      <span>[BASE] GEOLOGIST BASE (භූවිද්‍යා කඳවුර)</span>
                    </div>
                    <div className="topo-zone-tag zone-river" style={{ left: "24%", top: "42%" }}>
                      <span>[RAFT] BAMBOO RAFT (උණ බම්බු පහුර)</span>
                    </div>
                    <div className="topo-zone-tag zone-swamp hazard" style={{ left: "48%", top: "72%" }}>
                      <span>[HAZARD] WATERFALL SPRAY (දියඇලි අගාධය)</span>
                    </div>
                    <div className="topo-zone-tag zone-cave" style={{ left: "70%", top: "62%" }}>
                      <span>[MINE] OLD GEM MINE (පැරණි පතල)</span>
                    </div>
                    <div className="topo-zone-tag zone-helipad extract" style={{ left: "86%", top: "78%" }}>
                      <span>[TOWER] SIGNAL TOWER (සංඥා කුලුන)</span>
                    </div>

                    {/* Safe Campfire Pins */}
                    <div className="map-pin campfire-pin" style={{ left: "17%", top: "27%" }} title="දියඇලි කඳවුරේ ගිනිමැලය">
                      <Icons.Flame className="tactical-svg-icon map-fire-svg" />
                    </div>
                    <div className="map-pin campfire-pin" style={{ left: "61%", top: "65%" }} title="පතල් පිවිසුමේ ගිනිමැලය">
                      <Icons.Flame className="tactical-svg-icon map-fire-svg" />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Chapter 1 Zones */}
                    <div className="topo-river-band" />
                    <div className="topo-zone-tag zone-kudawa" style={{ left: "10%", top: "16%" }}>
                      <span>[ENTRY] KUDAWA ENTRY (කඳවුර)</span>
                    </div>
                    <div className="topo-zone-tag zone-outpost" style={{ left: "18%", top: "34%" }}>
                      <span>[OUTPOST] RANGER OUTPOST (මුරපොළ)</span>
                    </div>
                    <div className="topo-zone-tag zone-river" style={{ left: "36%", top: "38%" }}>
                      <span>[CROSSING] RIVER CROSSING (ඔරු තොට)</span>
                    </div>
                    <div className="topo-zone-tag zone-swamp hazard" style={{ left: "44%", top: "60%" }}>
                      <span>[HAZARD] LEECH SWAMP (කූඩැලි වගුර)</span>
                    </div>
                    <div className="topo-zone-tag zone-cave" style={{ left: "55%", top: "48%" }}>
                      <span>[CAVE] RUNIC CAVE (පුරාණ ලෙන)</span>
                    </div>
                    <div className="topo-zone-tag zone-helipad extract" style={{ left: "82%", top: "75%" }}>
                      <span>[EXTRACT] EXTRACTION HELIPAD (හෙලිපෑඩ්)</span>
                    </div>

                    {/* Safe Campfire Pins */}
                    <div className="map-pin campfire-pin" style={{ left: "15%", top: "37%" }} title="මුරපොළේ ගිනිමැලය">
                      <Icons.Flame className="tactical-svg-icon map-fire-svg" />
                    </div>
                    <div className="map-pin campfire-pin" style={{ left: "51%", top: "58%" }} title="ලෙන් දොරටුවේ ගිනිමැලය">
                      <Icons.Flame className="tactical-svg-icon map-fire-svg" />
                    </div>
                  </>
                )}

                {/* Player Real-Time Marker with Beacon Rings */}
                <div
                  className="pda-player-beacon"
                  style={{
                    left: `${(stats.playerX / 3200) * 100}%`,
                    top: `${(stats.playerY / 2400) * 100}%`,
                  }}
                >
                  <div className="beacon-ping" />
                  <div className="beacon-core" />
                  <span className="beacon-label">YOU (EXPLORER)</span>
                </div>

                {/* Active Objective Pin */}
                <div
                  className="pda-objective-pin"
                  style={{
                    left: `${(activeObj.x / 3200) * 100}%`,
                    top: `${(activeObj.y / 2400) * 100}%`,
                  }}
                >
                  <span className="obj-pin-icon">
                    {Icons[activeObj.icon] ? React.createElement(Icons[activeObj.icon], { className: "tactical-svg-icon" }) : <Icons.Target className="tactical-svg-icon" />}
                  </span>
                  <div className="obj-pin-sonar" />
                  <span className="obj-pin-text">{activeObj.title} [{distToActiveObj}m]</span>
                </div>
              </div>

              {/* Tactical Map Side Dossier */}
              <div className="pda-side-dossier">
                <div className="dossier-card">
                  <h4><Icons.Target className="tactical-svg-icon" /> ACTIVE MISSION DIRECTIVE</h4>
                  <div className="dossier-obj-header">
                    <span className="dossier-icon">
                      {Icons[activeObj.icon] ? React.createElement(Icons[activeObj.icon], { className: "tactical-svg-icon" }) : <Icons.Target className="tactical-svg-icon" />}
                    </span>
                    <div>
                      <strong>{activeObj.title}</strong>
                      <p>{activeObj.desc}</p>
                    </div>
                  </div>
                  <div className="dossier-dist-meter">
                    <span>ඉලක්කයට දුර:</span>
                    <span className="dist-highlight">{distToActiveObj} METERS</span>
                  </div>
                </div>

                <div className="dossier-card">
                  <h4><Icons.Map className="tactical-svg-icon" /> MAP LEGEND & ADVISORY</h4>
                  <ul className="map-legend-list">
                    <li><span className="legend-dot dot-player" /> <strong>ඔබගේ ස්ථානය:</strong> තත්‍ය කාලීන GPS සංඥාව</li>
                    <li><span className="legend-dot dot-obj" /> <strong>වත්මන් ඉලක්කය:</strong> ප්‍රමුඛ හෝඩුවාව</li>
                    <li><span className="legend-dot dot-fire" /> <strong>ගිනිමැල කලාප:</strong> Health / Sanity සුවපත් කරයි & ඔසුපැන්</li>
                    <li><span className="legend-dot dot-danger" /> <strong>අන්තරායකර කලාප:</strong> කූඩැල්ලන් සහ ගැඹුරු දියපාරවල්</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Survival Backpack / Inventory Modal [I] ── */}
      {showInventory && (
        <div className="survival-inventory-overlay" onClick={() => setShowInventory(false)}>
          <div className="survival-inventory-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inventory-header">
              <div className="inv-title-box">
                <span className="inv-badge">EXPEDITION FIELD GEAR // CHAPTER 0{activeChapter}</span>
                <h2><Icons.Backpack className="tactical-svg-icon" /> පැවැත්මේ බඩු මල්ල (SURVIVAL BACKPACK)</h2>
              </div>
              <button
                className="close-btn"
                onClick={() => {
                  if (engineRef.current) engineRef.current.playSfx("pda_close");
                  setShowInventory(false);
                }}
              >
                ✕ CLOSE [I]
              </button>
            </div>

            <div className="inventory-grid-wrap">
              {/* Item 1: Salt */}
              <div className="inv-item-card">
                <div className="inv-item-icon"><Icons.Salt className="tactical-svg-icon" /></div>
                <div className="inv-item-info">
                  <h3>පිරිසිදු ලුණු පැකට් (Salt Pouches)</h3>
                  <span className="inv-item-qty">තොගය: {stats.saltCount} ක්</span>
                  <p>කූඩැල්ලන් ශරීරයට එල්ලී ලේ උරා බොද්දී ඔවුන් විනාශ කිරීමට භාවිතා කරයි.</p>
                </div>
                <button
                  className="inv-action-btn"
                  disabled={stats.saltCount <= 0}
                  onClick={() => {
                    if (engineRef.current) engineRef.current.throwSalt();
                  }}
                >
                  විසි කරන්න [1]
                </button>
              </div>

              {/* Item 2: Herb */}
              <div className="inv-item-card">
                <div className="inv-item-icon"><Icons.Herb className="tactical-svg-icon" /></div>
                <div className="inv-item-info">
                  <h3>සුවදායක වැසි වනාන්තර ඖෂධ (Medicinal Herbs)</h3>
                  <span className="inv-item-qty">තොගය: {stats.herbCount} ක්</span>
                  <p>තුවාල සුවපත් කර +30 Health ලබාදෙන දුර්ලභ සිංහරාජ වනජීවී පැළෑටියකි.</p>
                </div>
                <button
                  className="inv-action-btn heal-btn"
                  disabled={stats.herbCount <= 0}
                  onClick={() => {
                    if (engineRef.current) engineRef.current.useHerb();
                  }}
                >
                  සුවපත් වන්න (+30 HP) [2]
                </button>
              </div>

              {/* Item 2.5: Leech Balm */}
              <div className="inv-item-card">
                <div className="inv-item-icon"><Icons.Balm className="tactical-svg-icon" /></div>
                <div className="inv-item-info">
                  <h3>කූඩැලි විකර්ෂක ආලේපනය (Leech Repellent Balm)</h3>
                  <span className="inv-item-qty">
                    තොගය: {stats.balmCount} ක් {stats.repellentTimer > 0 ? `(ආරක්ෂාව: ${stats.repellentTimer}s)` : ""}
                  </span>
                  <p>කූඩැල්ලන් විකර්ෂණය කරන දේශීය තෙලකි. තත්පර 90ක් යනතුරු කූඩැල්ලන් පළා යයි.</p>
                </div>
                <button
                  className="inv-action-btn"
                  disabled={stats.balmCount <= 0}
                  onClick={() => {
                    if (engineRef.current) engineRef.current.useBalm();
                  }}
                >
                  තවරන්න [B]
                </button>
              </div>

              {/* Item 2.8: Camera */}
              <div className="inv-item-card">
                <div className="inv-item-icon"><Icons.Camera className="tactical-svg-icon" /></div>
                <div className="inv-item-info">
                  <h3>ක්ෂේත්‍ර කැමරාව (Expedition Field Camera)</h3>
                  <span className="inv-item-qty">ඡායාරූප ගෙන ඇත: {capturedPhotos.length} / 4</span>
                  <p>සිංහරාජයේ ආවේණික සතුන් (කැහිබෙල්ලා, කළු වඳුරා, පොළඟා, කලාමැදිරියන්) සමීපයේදී ඡායාරූප ගන්න.</p>
                </div>
                <button
                  className="inv-action-btn"
                  onClick={() => {
                    if (engineRef.current) engineRef.current.takePhoto();
                  }}
                >
                  SNAP [C]
                </button>
              </div>

              {/* Item 3: Torch */}
              <div className="inv-item-card">
                <div className="inv-item-icon"><Icons.Torch className="tactical-svg-icon" /></div>
                <div className="inv-item-info">
                  <h3>ක්‍ෂේත්‍ර විදුලි පන්දම (Heavy Halogen Torch)</h3>
                  <span className="inv-item-qty">
                    බැටරි: {stats.battery}% | තත්ත්වය: {stats.torchOn ? "ක්‍රියාත්මකයි (ON)" : "අක්‍රියයි (OFF)"}
                  </span>
                  <p>ඝන අන්ධකාරය දුරු කර Sanity ආරක්ෂා කරගැනීමට අවශ්‍ය වේ.</p>
                </div>
                <button
                  className="inv-action-btn"
                  onClick={() => {
                    if (engineRef.current) {
                      engineRef.current.torchOn = !engineRef.current.torchOn;
                      engineRef.current.playSfx("step");
                    }
                  }}
                >
                  {stats.torchOn ? "නිවන්න (OFF)" : "දල්වන්න (ON)"} [3]
                </button>
              </div>

              {activeChapter === 2 ? (
                <>
                  {/* Chapter 2 Item 1: Geologist Map */}
                  <div className={`inv-item-card ${evidence.map2 ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Map className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>භූවිද්‍යාඥයින්ගේ සිතියම (Geologist Map)</h3>
                      <span className="inv-item-qty">{evidence.map2 ? "✓ හමුවිය (EVIDENCE 01)" : "තවමත් හමුවී නැත"}</span>
                      <p>පැරණි පතල සහ උණ බම්බු පහුරේ පිහිටීම සලකුණු කර ඇති රහස් සිතියමයි.</p>
                    </div>
                  </div>

                  {/* Chapter 2 Item 2: Tape */}
                  <div className={`inv-item-card ${evidence.tape ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Tape className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>පටිගත කළ හඬපටය (Audio Cassette)</h3>
                      <span className="inv-item-qty">{evidence.tape ? "✓ ළඟ ඇත (EVIDENCE 02)" : "තවමත් හමුවී නැත"}</span>
                      <p>අතුරුදහන් වූ ගවේෂකයන්ගේ අවසාන හඬ පණිවිඩය අඩංගු කැසට් පටයයි.</p>
                    </div>
                    {evidence.tape && (
                      <button
                        className="inv-action-btn inspect-btn"
                        onClick={() => setInspectTapeOpen(true)}
                      >
                        අසන්න (LISTEN)
                      </button>
                    )}
                  </div>

                  {/* Chapter 2 Item 3: Gem */}
                  <div className={`inv-item-card ${evidence.gem ? "item-discovered highlight" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Crystal className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>නිල් ස්ඵටික සාම්පලය (Blue Crystal)</h3>
                      <span className="inv-item-qty">{evidence.gem ? "✓ ළඟ ඇත (EVIDENCE 03)" : "තවමත් හමුවී නැත"}</span>
                      <p>පැරණි පතලෙන් ලබාගත් අද්භූත බලයක් විහිදුවන දිදුලන නිල් ස්ඵටිකයයි.</p>
                    </div>
                  </div>
                </>
              ) : activeChapter === 3 ? (
                <>
                  {/* Chapter 3 Item 1: Slate */}
                  <div className={`inv-item-card ${evidence.ch3_slate ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Scroll className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>ප්‍රාග් ඓතිහාසික ශිලා ලේඛනය</h3>
                      <span className="inv-item-qty">{evidence.ch3_slate ? "✓ හමුවිය (EVIDENCE 01)" : "තවමත් හමුවී නැත"}</span>
                      <p>ලෙන් අගාධයේ සොරොව්ව සහ ගිලීගිය ලෙන් ශුද්ධ භූමිය පිළිබඳ පුරාණ විස්තරය.</p>
                    </div>
                  </div>

                  {/* Chapter 3 Item 2: Core */}
                  <div className={`inv-item-card ${evidence.ch3_core ? "item-discovered highlight" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Orb className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>ප්‍රතිදීප්ත අගාධ පාෂාණය</h3>
                      <span className="inv-item-qty">{evidence.ch3_core ? "✓ ළඟ ඇත (EVIDENCE 02)" : "තවමත් හමුවී නැත"}</span>
                      <p>ගිලීගිය ශුද්ධ භූමියේ ජලය බැස්සවීමෙන් පසු සොයාගත් දීප්තිමත් දම් ස්ඵටිකය.</p>
                    </div>
                  </div>

                  {/* Chapter 3 Item 3: Miner Log */}
                  <div className={`inv-item-card ${evidence.ch3_torch ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Lantern className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>පතල් කම්කරු අවසාන වාර්තාව</h3>
                      <span className="inv-item-qty">{evidence.ch3_torch ? "✓ හමුවිය (EVIDENCE 03)" : "තවමත් හමුවී නැත"}</span>
                      <p>1987 පතල් කම්කරුවන් අගාධයෙන් ඉහළ රහස් පර්යේෂණාගාරයට පිවිසි බවට වූ ලේඛනය.</p>
                    </div>
                  </div>
                </>
              ) : activeChapter === 4 ? (
                <>
                  {/* Chapter 4 Item 1: Dossier */}
                  <div className={`inv-item-card ${evidence.ch4_docs ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Folder className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>1987 රහස් ව්‍යාපෘති ලිපිගොනුව</h3>
                      <span className="inv-item-qty">{evidence.ch4_docs ? "✓ හමුවිය (EVIDENCE 01)" : "තවමත් හමුවී නැත"}</span>
                      <p>විද්‍යාගාර පරිගණකයෙන් ලබාගත් ජෛව පර්යේෂණ සහ විකෘති DNA වාර්තාව.</p>
                    </div>
                  </div>

                  {/* Chapter 4 Item 2: Keycard */}
                  <div className={`inv-item-card ${evidence.ch4_keycard ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Keycard className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>Level 3 ප්‍රවේශ කාඩ්පත</h3>
                      <span className="inv-item-qty">{evidence.ch4_keycard ? "✓ ළඟ ඇත (EVIDENCE 02)" : "තවමත් හමුවී නැත"}</span>
                      <p>ක්‍රයෝ-කුටිය සහ වියන් මොනොරේල් වායු අගුළුව විවෘත කළ හැකි විද්‍යුත් කාඩ්පත.</p>
                    </div>
                  </div>

                  {/* Chapter 4 Item 3: DNA */}
                  <div className={`inv-item-card ${evidence.ch4_sample ? "item-discovered highlight" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Dna className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>විකෘති DNA සාම්පලය</h3>
                      <span className="inv-item-qty">{evidence.ch4_sample ? "✓ ළඟ ඇත (EVIDENCE 03)" : "තවමත් හමුවී නැත"}</span>
                      <p>ක්‍රයෝ-කුටිය තුළ වසර 30ක් සුරක්ෂිතව පැවති දුර්ලභ විකෘති ජෛව සාම්පලය.</p>
                    </div>
                  </div>
                </>
              ) : activeChapter === 5 ? (
                <>
                  {/* Chapter 5 Item 1: Blackbox */}
                  <div className={`inv-item-card ${evidence.ch5_blackbox ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Box className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>ගවේෂණ කළු පෙට්ටිය (Blackbox)</h3>
                      <span className="inv-item-qty">{evidence.ch5_blackbox ? "✓ හමුවිය (EVIDENCE 01)" : "තවමත් හමුවී නැත"}</span>
                      <p>1987 හෙලිකොප්ටර් අනතුරේ සම්පූර්ණ ටෙලිමෙට්‍රි සහ සංවාද දත්ත අඩංගු ෆ්ලයිට් රෙකෝඩරය.</p>
                    </div>
                  </div>

                  {/* Chapter 5 Item 2: Confession */}
                  <div className={`inv-item-card ${evidence.ch5_truth ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Scroll className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>මහාචාර්ය ඩග්ලස්ගේ අවසාන පාපොච්චාරණය</h3>
                      <span className="inv-item-qty">{evidence.ch5_truth ? "✓ හමුවිය (EVIDENCE 02)" : "තවමත් හමුවී නැත"}</span>
                      <p>සිංහරාජයේ රහස සහ විකෘති ශාකයෙන් සුව කළ හැකි විශ්වීය ඖෂධීය සූත්‍රය.</p>
                    </div>
                  </div>

                  {/* Chapter 5 Item 3: Beacon */}
                  <div className={`inv-item-card ${evidence.ch5_beacon ? "item-discovered highlight" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Satellite className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>සැටලයිට් බීකන සම්ප්‍රේෂණය</h3>
                      <span className="inv-item-qty">{evidence.ch5_beacon ? "✓ ක්‍රියාත්මකයි (EVIDENCE 03)" : "තවමත් සක්‍රිය කර නැත"}</span>
                      <p>සත්‍යය මුළු ලොවටම ප්‍රචාරය කරමින් චන්ද්‍රිකාව හා සම්බන්ධ වූ සක්‍රිය බීකනය.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Chapter 1 Item 1: Diary */}
                  <div className={`inv-item-card ${evidence.diary ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Book className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>ලෙයින් පෙඟුණු දිනපොත (Bloody Ranger Diary)</h3>
                      <span className="inv-item-qty">{evidence.diary ? "✓ හමුවිය (EVIDENCE 01)" : "තවමත් හමුවී නැත"}</span>
                      <p>
                        {evidence.diary
                          ? "1987 ගවේෂණ කණ්ඩායමේ රහස් සටහන් සහ ලෙන් දොරටුවේ රහස් කේතය අඩංගුය."
                          : "මුරපොළේ මේසය පරීක්ෂා කර සොයාගන්න."}
                      </p>
                    </div>
                    {evidence.diary && (
                      <button
                        className="inv-action-btn inspect-btn"
                        onClick={() => setInspectDiaryOpen(true)}
                      >
                        කියවන්න (INSPECT)
                      </button>
                    )}
                  </div>

                  {/* Chapter 1 Item 2: Brass Key */}
                  <div className={`inv-item-card ${evidence.key ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Key className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>පුරාණ පිත්තල යතුර (Ancient Brass Key)</h3>
                      <span className="inv-item-qty">{evidence.key ? "✓ ළඟ ඇත (EVIDENCE 02)" : "තවමත් හමුවී නැත"}</span>
                      <p>
                        {evidence.key
                          ? "සිංහරාජයේ රහස් භූගත ලෙන විවෘත කිරීමට අවශ්‍ය පුරාණ කැටයම් සහිත යතුරයි."
                          : "ගංගා ඉවුරේ පැරණි ඔරුව අසල ඇත."}
                      </p>
                    </div>
                  </div>

                  {/* Chapter 1 Item 3: Research Sample */}
                  <div className={`inv-item-card ${evidence.sample ? "item-discovered highlight" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Vial className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>පර්යේෂණ සාම්පලය (Bioluminescent Sample)</h3>
                      <span className="inv-item-qty">{evidence.sample ? "✓ ළඟ ඇත (EVIDENCE 03)" : "තවමත් හමුවී නැත"}</span>
                      <p>
                        {evidence.sample
                          ? "වසර 30ක් අතුරුදහන් වූ කණ්ඩායම සොයාගත් නිල් ආලෝකය විහිදුවන දිලීර සාම්පලය."
                          : "ගල් ලෙන තුළ ආරක්ෂිතව ඇත."}
                      </p>
                    </div>
                  </div>

                  {/* Chapter 1 Tactical Item: UV Lens */}
                  <div className={`inv-item-card ${stats.uvUnlocked ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.UV className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>පාරජම්බුල කාචය (UV Blacklight Filter)</h3>
                      <span className="inv-item-qty">{stats.uvUnlocked ? (stats.uvMode ? "✓ සක්‍රියයි (UV ON)" : "✓ ළඟ ඇත (UV OFF)") : "තවමත් හමුවී නැත"}</span>
                      <p>
                        {stats.uvUnlocked
                          ? "විදුලි පන්දමට සවි කර 1987 රහස් පා සටහන් සහ සංකේත දැකගත හැක. [U] ඔබන්න."
                          : "මුරපොළේ මේසය යටින් සොයාගන්න."}
                      </p>
                    </div>
                    {stats.uvUnlocked && (
                      <button
                        className="inv-action-btn"
                        onClick={() => handleVirtualAction("uv")}
                      >
                        {stats.uvMode ? "OFF කරන්න" : "ක්‍රියාත්මක කරන්න [U]"}
                      </button>
                    )}
                  </div>

                  {/* Chapter 1 Tactical Item: Emergency Flare Gun */}
                  <div className={`inv-item-card ${stats.flareGunFound ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Siren className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>හදිසි සංඥා තුවක්කුව (Signal Flare Gun)</h3>
                      <span className="inv-item-qty">{stats.flareGunFound ? "✓ සුදානම් (READY)" : "තවමත් හමුවී නැත"}</span>
                      <p>
                        {stats.flareGunFound
                          ? "සාක්ෂි 3ම සම්පූර්ණ කළ පසු හෙලිපෑඩ් වෙත ගොස් [E] ඔබා හෙලිකොප්ටරය කැඳවන්න."
                          : "මුරපොළේ ලොකරය තුළ ඇත."}
                      </p>
                    </div>
                  </div>

                  {/* Chapter 1 Field Item: Sacred Blue Magpie Feathers */}
                  <div className={`inv-item-card ${stats.magpieCharmActive ? "item-discovered highlight" : stats.feathersCollected > 0 ? "item-discovered" : "item-missing"}`}>
                    <div className="inv-item-icon"><Icons.Feather className="tactical-svg-icon" /></div>
                    <div className="inv-item-info">
                      <h3>කැහිබෙලි නිල් පිහාටු (Sacred Feathers)</h3>
                      <span className="inv-item-qty">
                        {stats.magpieCharmActive ? "✓ ආමුදිතය ක්‍රියාත්මකයි (+20% Speed & Stamina)" : `එකතු කර ඇත: ${stats.feathersCollected} / 3`}
                      </span>
                      <p>
                        {stats.magpieCharmActive
                          ? "පිහාටු 3ම සතු බැවින් කැහිබෙලි ආමුදිතය මඟින් ක්‍රීඩකයාට අමතර වේගයක් සහ ශක්තියක් ලබාදේ!"
                          : "වන මාවත් ඔස්සේ පිහාටු 3ම සොයාගෙන විශේෂ වේග බූස්ට් එක සක්‍රිය කරගන්න."}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Handwritten Diary Parchment Modal ── */}
      {inspectDiaryOpen && (
        <div className="diary-inspect-overlay" onClick={() => setInspectDiaryOpen(false)}>
          <div className="diary-parchment-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-pin-header">
              <span className="sheet-date">1987 නොවැම්බර් මස 14 වන දින - කුඩව මුරපොළ</span>
              <button className="close-btn" onClick={() => setInspectDiaryOpen(false)}>✕</button>
            </div>
            <div className="handwritten-entry">
              <h3>මහාචාර්ය ඩග්ලස්ගේ අත්අකුරු සටහන:</h3>
              <p>
                “...අපගේ පර්යේෂණ කණ්ඩායමේ තිදෙනාම දැන් සූදානම්. රාත්‍රියේදී කැලයේ අමුතු ශබ්ද ඇසෙයි.
                කූඩැල්ලන්ගෙන් බේරීමට ගිනිමැල දැල්වීම අත්‍යවශ්‍ය වේ.
              </p>
              <p>
                ගංගාවෙන් එතෙර වී කඳු පාමුල ඇති පුරාණ ලෙනට පිවිසීමට නම්, ගල් දොරටුවේ ඇති සංකේත තුන
                පිළිවෙලින් තැබිය යුතුය:
              </p>
              <div className="rune-secret-highlight">
                <strong>[I] SUN (සූර්යයා)</strong><br />
                <strong>[II] RIVER (ගංගාව)</strong><br />
                <strong>[III] LION (සිංහයා)</strong>
              </div>
              <p>
                යතුර ගංගා ඉවුරේ පැරණි ඔරු තොටේ සඟවා තැබුවෙමි. දෙවියනේ අපට පිහිට වන්න...”
              </p>
            </div>
            <button className="diary-close-action" onClick={() => setInspectDiaryOpen(false)}>
              සටහන වසන්න (CLOSE DIARY)
            </button>
          </div>
        </div>
      )}

      {/* ── Audio Cassette Transcript Modal (Chapter 2) ── */}
      {inspectTapeOpen && (
        <div className="diary-inspect-overlay" onClick={() => setInspectTapeOpen(false)}>
          <div className="diary-parchment-sheet tape-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-pin-header">
              <span className="sheet-date">[AUDIO REEL] ශ්‍රව්‍ය පට පිටපත // SONY TCM-150 REEL</span>
              <button className="close-btn" onClick={() => setInspectTapeOpen(false)}>✕</button>
            </div>
            <div className="handwritten-entry">
              <h3>භූවිද්‍යාඥ කණ්ඩායමේ අවසාන හඬ පණිවිඩය:</h3>
              <p>
                <em>“(ස්ථිතික හඬ... දියඇල්ලක ඝෝෂාව පසුබිමින් ඇසේ...)”</em>
              </p>
              <p>
                “අද 1987 දෙසැම්බර් 02. අපි දියඇලි අගාධය හරහා උණ බම්බු පහුරෙන් එතෙර වුණා.
                පැරණි පතල තුළින් නිල් පැහැති ආලෝකයක් විහිදෙනවා! අපි ඒ ස්ඵටිකය ලබාගත්තා...
              </p>
              <p>
                නමුත් අපේ සන්නිවේදන යන්ත්‍ර සියල්ල ක්‍රියා විරහිත වුණා. කවුරුන් හෝ මෙය සොයාගන්නේ නම්,
                කඳු මුදුනේ ඇති සංඥා කුලුනෙන් රතු එළිය දල්වා හෙලිකොප්ටරය කැඳවන්න!”
              </p>
            </div>
            <button className="diary-close-action" onClick={() => setInspectTapeOpen(false)}>
              හඬපටය වසන්න (CLOSE TRANSCRIPT)
            </button>
          </div>
        </div>
      )}

      {/* ── Audio Cassette Transcript Modal (Chapter 1: Prof Douglas 1987 Audio Log) ── */}
      {inspectDouglasTapeOpen && (
        <div className="diary-inspect-overlay" onClick={() => setInspectDouglasTapeOpen(false)}>
          <div className="diary-parchment-sheet tape-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-pin-header">
              <span className="sheet-date">[AUDIO LOG] මහාචාර්ය ඩග්ලස්ගේ හඬපටය // 1987 REEL-TO-REEL LOG</span>
              <button className="close-btn" onClick={() => setInspectDouglasTapeOpen(false)}>✕</button>
            </div>
            <div className="handwritten-entry">
              <h3>කුඩව මුරපොළේ අවසන් පටිගත කිරීම (1987 නොවැම්බර් 14):</h3>
              <p>
                <em>“(චක චක... පැරණි කැසට් රීලය කැරකෙන ශබ්දය සහ ඇදහැලෙන වැහි හඬ...)”</em>
              </p>
              <p>
                “මා කණ්ඩායමේ නායක මහාචාර්ය ඩග්ලස්. වේලාව සවස 5යි... හිටිවනම ගංගා නිම්නයට මහා වැසි කුණාටුවක් කඩා වැටුණා.
                ගඟ පිටාර ගලා ඇති බැවින් සාමාන්‍ය මාවතෙන් එතෙර විය නොහැකියි! යෝධ ගස් කොටන් පාලම (Fallen Tree Log Bridge) ඔස්සේ පමණක් ආරක්ෂිතව යා හැකියි.
              </p>
              <p>
                අපගේ හෝඩුවාවන් සහ රහස් සංකේත සලකුණු කිරීමට අප පාරජම්බුල (UV) තීන්ත භාවිතා කළා.
                මේසය යට ඇති <strong>UV Blacklight කාචය [U]</strong> රැගෙන එන්න. අපගේ දීප්තිමත් පා සටහන් (Footprints) ලෙන දෙසට මඟ පෙන්වනු ඇත!
              </p>
              <p>
                එමෙන්ම හදිසි ගැලවුම් සංඥා තුවක්කුව (Flare Gun) ලොකරයේ සුරක්ෂිතව තැබුවෙමි. සාක්ෂි 3ම සොයාගත් පසු හෙලිපෑඩ් වෙත ගොස් සංඥා කරන්න... දෙවියන් ඔබ රැකදේවා!”
              </p>
            </div>
            <button className="diary-close-action" onClick={() => setInspectDouglasTapeOpen(false)}>
              හඬපටය වසන්න (CLOSE AUDIO LOG)
            </button>
          </div>
        </div>
      )}

      {/* ── Wildlife Photography Snap Flash & Polaroid Modal ── */}
      {photoFlash && <div className="photo-flash-overlay" />}

      {photoModal && (
        <div className="photo-preview-overlay" onClick={() => setPhotoModal(null)}>
          <div className="photo-polaroid-card animate-snap" onClick={(e) => e.stopPropagation()}>
            <div className="polaroid-pin"><Icons.Pin className="tactical-svg-icon" /></div>
            <div className="polaroid-art-frame">
              <span className="polaroid-subject-icon">
                {Icons[photoModal.icon] ? React.createElement(Icons[photoModal.icon], { className: "tactical-svg-icon" }) : <Icons.Camera className="tactical-svg-icon" />}
              </span>
              <span className="polaroid-stamp">SINHARAJA ARCHIVE // 1987</span>
            </div>
            <div className="polaroid-caption">
              <h3>{photoModal.name}</h3>
              <p>{photoModal.desc}</p>
              <span className="polaroid-subject-tag">WILDLIFE RECORDED ✓</span>
            </div>
            <button className="polaroid-save-btn" onClick={() => setPhotoModal(null)}>
              ඇල්බමයට සුරකින්න (CLOSE) [SPACE]
            </button>
          </div>
        </div>
      )}

      {/* Mobile Touch Controls Zone (Dual Scheme: 360° Analog Joystick vs Classic D-Pad) */}
      <div className="touch-controls">
        {controlScheme === "joystick" ? (
          <div
            className="virtual-joystick-zone"
            onTouchStart={handleJoystickStart}
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
            onTouchCancel={handleJoystickEnd}
          >
            <div className="joystick-base">
              <div className="joystick-crosshair-h" />
              <div className="joystick-crosshair-v" />
              <div
                className={`joystick-knob ${joystickPos.active ? "knob-active" : ""}`}
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                }}
              >
                <div className="knob-center-ring" />
              </div>
            </div>
            <button
              className="joystick-switch-mode-btn"
              onClick={toggleControlScheme}
              title="D-Pad එකට මාරු වන්න"
            >
              D-PAD
            </button>
          </div>
        ) : (
          <div className="dpad-box">
            <button
              className="dpad-btn up"
              onMouseDown={() => handleVirtualDir("w", true)}
              onMouseUp={() => handleVirtualDir("w", false)}
              onTouchStart={() => handleVirtualDir("w", true)}
              onTouchEnd={() => handleVirtualDir("w", false)}
            >
              ▲
            </button>
            <div className="dpad-row">
              <button
                className="dpad-btn left"
                onMouseDown={() => handleVirtualDir("a", true)}
                onMouseUp={() => handleVirtualDir("a", false)}
                onTouchStart={() => handleVirtualDir("a", true)}
                onTouchEnd={() => handleVirtualDir("a", false)}
              >
                ◀
              </button>
              <button
                className="dpad-btn right"
                onMouseDown={() => handleVirtualDir("d", true)}
                onMouseUp={() => handleVirtualDir("d", false)}
                onTouchStart={() => handleVirtualDir("d", true)}
                onTouchEnd={() => handleVirtualDir("d", false)}
              >
                ▶
              </button>
            </div>
            <button
              className="dpad-btn down"
              onMouseDown={() => handleVirtualDir("s", true)}
              onMouseUp={() => handleVirtualDir("s", false)}
              onTouchStart={() => handleVirtualDir("s", true)}
              onTouchEnd={() => handleVirtualDir("s", false)}
            >
              ▼
            </button>
            <button
              className="joystick-switch-mode-btn"
              onClick={toggleControlScheme}
              title="ජෝයිස්ටික් එකට මාරු වන්න"
            >
              JOYSTICK
            </button>
          </div>
        )}

        <div className="action-buttons-touch">
          <button
            className="touch-action-btn map-touch"
            onClick={() => {
              if (engineRef.current) engineRef.current.playSfx("pda_open");
              setShowTacticalMap(true);
            }}
          >
            [MAP]
          </button>
          <button
            className="touch-action-btn bag-touch"
            onClick={() => {
              if (engineRef.current) engineRef.current.playSfx("pda_open");
              setShowInventory(true);
            }}
          >
            [BAG]
          </button>
          <button
            className="touch-action-btn salt-touch"
            onClick={() => handleVirtualAction("salt")}
          >
            [SALT]
          </button>
          <button
            className="touch-action-btn herb-touch"
            onClick={() => handleVirtualAction("herb")}
          >
            [HEAL]
          </button>
          <button
            className="touch-action-btn balm-touch"
            onClick={() => handleVirtualAction("balm")}
          >
            [BALM]
          </button>
          <button
            className={`touch-action-btn crank-touch ${stats.battery < 25 ? "crank-alert-btn" : ""}`}
            onClick={() => handleVirtualAction("crank")}
            title="හෑන්ඩ්-ක්‍රෑන්ක් ඩයිනමෝව [R]"
          >
            [CRANK]
          </button>
          <button
            className="touch-action-btn tea-touch"
            onClick={() => handleVirtualAction("tea")}
          >
            [TEA]
          </button>
          {(stats.chapter === 2 || activeChapter === 2) && (
            <button
              className="touch-action-btn tea-touch ginger-touch"
              onClick={() => handleVirtualAction("gingertea")}
              title="ඉඟුරු තේ"
            >
              [WARM TEA]
            </button>
          )}
          {stats.uvUnlocked && (
            <button
              className={`touch-action-btn uv-touch ${stats.uvMode ? "active-uv" : ""}`}
              onClick={() => handleVirtualAction("uv")}
            >
              {stats.uvMode ? "[UV ON]" : "[UV]"}
            </button>
          )}
          <button
            className={`touch-action-btn cam-touch ${stats.viewMode === "fps" ? "active-fps-btn" : ""}`}
            onClick={() => handleVirtualAction("viewMode")}
            title="1st Person IGI / 2.5D Isometric [V]"
          >
            {stats.viewMode === "fps" ? "[1ST PERSON]" : "[2.5D]"}
          </button>
          <button
            className="touch-action-btn cam-touch"
            onClick={() => handleVirtualAction("camera")}
          >
            [CAM]
          </button>
          <button
            className="touch-action-btn interact-touch"
            onClick={() => handleVirtualAction("interact")}
          >
            [E] ACTION
          </button>
        </div>
      </div>
    </div>
  );
}