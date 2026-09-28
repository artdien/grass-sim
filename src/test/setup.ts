import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// RTL's automatic cleanup relies on global afterEach, which is off — register it ourselves.
afterEach(() => cleanup());
