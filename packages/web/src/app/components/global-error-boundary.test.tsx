// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { GlobalErrorBoundary } from './global-error-boundary';

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string) => key,
}));

vi.mock('@/lib/error-reporting', () => ({
  errorReporting: {
    report: vi.fn(),
    isChunkLoadError: vi.fn(() => false),
  },
}));

const ThrowingChild = (): ReactElement => {
  throw new Error('boom-diagnostics-test');
};

describe('GlobalErrorBoundary', () => {
  it('renders the crash fallback when a child throws', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowingChild />
      </GlobalErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('shows technical details without unmounting the app', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowingChild />
      </GlobalErrorBoundary>,
    );

    fireEvent.click(screen.getByText('Show technical details'));

    expect(screen.getByText(/Message: boom-diagnostics-test/)).toBeTruthy();
    expect(screen.getByText('Hide technical details')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });
});
