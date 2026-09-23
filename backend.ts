/**
 * Canonical Single Source of Truth: server.ts
 * backend.ts is retained as an alias / re-export to ensure 100% backward compatibility
 * across any imports without maintaining duplicate route implementations.
 */
export * from './server';
export { app, default } from './server';
