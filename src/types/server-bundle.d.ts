declare module '*.bundle.mjs' {
  import type { Express } from 'express';

  const app: Express;
  export default app;
}
