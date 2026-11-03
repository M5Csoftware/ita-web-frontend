// src/lib/api.ts
// Centralized API base URL helper.
// Ensures trailing slashes or duplicate /api prefixes are cleanly stripped.
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

