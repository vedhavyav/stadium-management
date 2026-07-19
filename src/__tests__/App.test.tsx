import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Setup mock state for onAuthStateChanged dynamically in tests
let mockAuthUser: any = null;

// Mock HTMLElement.prototype.scrollIntoView because it is missing in jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Declare mocks BEFORE importing App to prevent ES import hoisting issues
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback(mockAuthUser);
    return () => {};
  }),
}));

vi.mock('../utils/firebase', () => ({
  auth: {},
  signInUser: vi.fn(),
  signUpUser: vi.fn(),
  logOutUser: vi.fn(),
  getCurrentUserProfile: vi.fn((uid) => {
    if (uid === 'fan-id') {
      return {
        id: "fan-id",
        email: "diego@stadium.com",
        name: "Diego Ramirez",
        role: "fan",
        languagePref: "en",
        currentLocation: { zone: "Section 104", x: 26, y: 35 }
      };
    } else if (uid === 'volunteer-id') {
      return {
        id: "volunteer-id",
        email: "sarah@stadium.com",
        name: "Sarah Jenkins",
        role: "volunteer",
        languagePref: "es",
        currentLocation: { zone: "Gate A", x: 15, y: 78 }
      };
    } else if (uid === 'organizer-id') {
      return {
        id: "organizer-id",
        email: "marcus@stadium.com",
        name: "Marcus Vance",
        role: "organizer",
        languagePref: "en",
        currentLocation: { zone: "Control Room", x: 50, y: 50 }
      };
    }
    return null;
  }),
}));

// Mock Recharts responsive container to avoid layout calculation issues in jsdom
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>();
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: '300px', height: '300px' }}>{children}</div>
    ),
  };
});

// Now safely import App under mock bindings
import App from '../App';

describe('ArenaOS Component Rendering & Interaction Tests', () => {

  beforeEach(() => {
    mockAuthUser = null;
  });

  it('should render the Sign In / Sign Up portal on startup when signed out', () => {
    mockAuthUser = null;
    render(<App />);
    
    expect(screen.getByText('ArenaOS Portal')).toBeInTheDocument();
    expect(screen.getByText('FIFA World Cup 2026 Smart Stadium')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('should toggle input fields when switching between Sign In and Register tabs', () => {
    mockAuthUser = null;
    render(<App />);

    expect(screen.queryByLabelText(/Display Name/i)).not.toBeInTheDocument();

    // Click "Register Account" tab
    const registerTabButton = screen.getByRole('button', { name: /Register Account/i });
    fireEvent.click(registerTabButton);

    // Display Name label should now be present
    expect(screen.getByText('Display Name')).toBeInTheDocument();
  });

  it('should render the Fan Spectator dashboard when authenticated as a fan', async () => {
    mockAuthUser = { uid: 'fan-id' };
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Diego Ramirez').length).toBeGreaterThan(0);
      expect(screen.getByText('MEXICO vs USA')).toBeInTheDocument();
      expect(screen.getByText(/AI Assistant/i)).toBeInTheDocument();
    });

    // Test typing a message into the Copilot chat input
    const input = screen.getByPlaceholderText(/Ask Copilot/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Where is the food stand?' } });
    expect(input.value).toBe('Where is the food stand?');

    // Click send
    const sendButton = screen.getByLabelText('Send message');
    fireEvent.click(sendButton);

    // Check that input resets and the message is listed
    expect(input.value).toBe('');
    expect(screen.getByText('Where is the food stand?')).toBeInTheDocument();
  });

  it('should render the Volunteer Staff dashboard and allow report submissions', async () => {
    mockAuthUser = { uid: 'volunteer-id' };
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Sarah Jenkins').length).toBeGreaterThan(0);
      expect(screen.getByText(/Spectator Query Translator/i)).toBeInTheDocument();
    });

    // Test incident reporting typing
    const reportInput = screen.getByPlaceholderText(/Describe incident/i) as HTMLTextAreaElement;
    fireEvent.change(reportInput, { target: { value: 'Water spill on stairs of gate A' } });
    expect(reportInput.value).toBe('Water spill on stairs of gate A');

    // Submit report
    const submitBtn = screen.getByRole('button', { name: /Submit AI Report/i });
    fireEvent.click(submitBtn);

    // Verify it clears out the report box on submit inside async wait block
    await waitFor(() => {
      expect(reportInput.value).toBe('');
    });
  });

  it('should render the Command Center dashboard and allow generating AI advice', async () => {
    mockAuthUser = { uid: 'organizer-id' };
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Marcus Vance').length).toBeGreaterThan(0);
      expect(screen.getByText(/Operations Advisor/i)).toBeInTheDocument();
    });

    // Click Advice generation button
    const adviceBtn = screen.getByRole('button', { name: /Generate.*Advice/i });
    fireEvent.click(adviceBtn);

    // Expect loading state message to render immediately
    expect(screen.getByText(/Analyzing live/i)).toBeInTheDocument();
  });

  it('should render the skip navigation link for accessibility support', () => {
    mockAuthUser = { uid: 'fan-id' };
    render(<App />);

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

});
