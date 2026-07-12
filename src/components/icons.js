// src/components/icons.js
//
// Íconos SVG en línea tomados de Lucide (misma familia de íconos ya usada
// en los artefactos de React de esta plataforma). Se usan como strings de
// HTML en vez de emojis (✉️, 🔑, 🏆, 🛡️) porque un emoji depende de la
// fuente de emojis instalada en el sistema operativo, y en algunos
// Windows se ve como una cajita rota en miniatura en vez del glifo real.
// Un SVG con currentColor se ve idéntico en cualquier navegador o
// sistema operativo, sin depender de ninguna fuente externa.

export const ICONS = {
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>',
  lock: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  user: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>',
  trophy:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="wcGlobeGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4ade80"/><stop offset="100%" stop-color="#0ea5e9"/></linearGradient></defs><rect x="15" y="40" width="18" height="3.4" rx="1" fill="#ffffff" opacity="0.95"/><rect x="18" y="35.4" width="12" height="4" fill="#ffffff" opacity="0.85"/><path d="M20.4 28 L19.4 35.4 L28.6 35.4 L27.6 28 Z" fill="#ffffff"/><path d="M14 12 C14 23 18.5 29 24 29 C29.5 29 34 23 34 12 Z" fill="#ffffff"/><circle cx="24" cy="9.2" r="7.6" fill="url(#wcGlobeGrad)"/><path d="M16.6 9.2 Q24 5 31.4 9.2" stroke="#ffffff" stroke-width="1.1" fill="none" opacity="0.85"/><path d="M16.6 9.2 Q24 13.4 31.4 9.2" stroke="#ffffff" stroke-width="1.1" fill="none" opacity="0.85"/><line x1="24" y1="1.6" x2="24" y2="16.8" stroke="#ffffff" stroke-width="1.1" opacity="0.85"/></svg>',
  shield:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  logout:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
};
