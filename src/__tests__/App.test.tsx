import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock Firebase module to prevent real network logins during compilation tests
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    // Trigger callback with null user to simulate signed-out state
    callback(null);
    return () => {};
  }),
}));

vi.mock('../utils/firebase', () => ({
  auth: {},
  signInUser: vi.fn(),
  signUpUser: vi.fn(),
  logOutUser: vi.fn(),
  getCurrentUserProfile: vi.fn(),
}));

// Mock Recharts responsive container to avoid drawing dimensions issues in jsdom
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: '300px', height: '300px' }}>{children}</div>
    ),
  };
});

describe('ArenaOS Component Rendering Tests', () => {

  it('should render the Sign In / Sign Up portal on startup', () => {
    render(<App />);
    
    // Check that portal details and headers are present
    expect(screen.getByText('ArenaOS Portal')).toBeInTheDocument();
    expect(screen.getByText('FIFA World Cup 2026 Smart Stadium')).toBeInTheDocument();
    
    // Check that form switch buttons exist
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register Account/i })).toBeInTheDocument();

    // Check that preseeded testing details are shown for accessibility
    expect(screen.getByText(/Pre-seeded testing accounts/i)).toBeInTheDocument();
  });

});
