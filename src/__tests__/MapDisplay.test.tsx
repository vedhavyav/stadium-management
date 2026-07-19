import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapDisplay } from '../components/MapDisplay';
import { Facility, Gate, Incident, User } from '../types';

const mockFacilities: Facility[] = [
  {
    id: 'fac-1',
    name: 'Taco World Express',
    type: 'concession',
    status: 'open',
    waitTimeMins: 5,
    coordinates: { x: 40, y: 40 }
  }
];

const mockGates: Gate[] = [
  {
    id: 'gate-a',
    name: 'Gate A',
    status: 'open',
    flowRateIn: 15,
    coordinates: { x: 10, y: 10 }
  }
];

const mockIncidents: Incident[] = [
  {
    id: 'inc-1',
    title: 'Water leak',
    description: 'Slippery stairs near Section 105',
    category: 'maintenance',
    status: 'pending',
    severity: 'medium',
    coordinates: { x: 20, y: 20 },
    reporterId: 'usr-1',
    assignedToId: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null
  }
];

const mockUsers: User[] = [
  {
    id: 'usr-1',
    email: 'test@stadium.com',
    name: 'Test Volunteer',
    role: 'volunteer',
    languagePref: 'en',
    currentLocation: { zone: 'Gate A', x: 15, y: 15 },
    status: 'active'
  }
];

describe('MapDisplay Component Tests', () => {

  it('should render the stadium map vector canvas and legend keys', () => {
    const setSelectedFacility = vi.fn();
    const setSelectedIncident = vi.fn();
    const setSimActive = vi.fn();
    const setNavigationPath = vi.fn();
    const handleSendFanMessage = vi.fn();
    const handleAutoDispatch = vi.fn();

    render(
      <MapDisplay
        facilities={mockFacilities}
        gates={mockGates}
        incidents={mockIncidents}
        users={mockUsers}
        role="fan"
        selectedFacility={null}
        setSelectedFacility={setSelectedFacility}
        selectedIncident={null}
        setSelectedIncident={setSelectedIncident}
        simActive={true}
        setSimActive={setSimActive}
        navigationPath={null}
        setNavigationPath={setNavigationPath}
        handleSendFanMessage={handleSendFanMessage}
        handleAutoDispatch={handleAutoDispatch}
      />
    );

    // Verify SVG layout and titles
    expect(screen.getByLabelText('Interactive visual layout map of the stadium')).toBeInTheDocument();
    expect(screen.getAllByText('Stadium Interactive Map').length).toBeGreaterThan(0);

    // Verify legend keys
    expect(screen.getByText('Concessions (F)')).toBeInTheDocument();
    expect(screen.getByText('Restrooms (W)')).toBeInTheDocument();
    expect(screen.getByText('Medical (M)')).toBeInTheDocument();
  });

  it('should trigger setSelectedFacility when clicking on concessions or restrooms', () => {
    const setSelectedFacility = vi.fn();
    const setSelectedIncident = vi.fn();
    const setSimActive = vi.fn();
    const setNavigationPath = vi.fn();
    const handleSendFanMessage = vi.fn();
    const handleAutoDispatch = vi.fn();

    render(
      <MapDisplay
        facilities={mockFacilities}
        gates={mockGates}
        incidents={mockIncidents}
        users={mockUsers}
        role="fan"
        selectedFacility={null}
        setSelectedFacility={setSelectedFacility}
        selectedIncident={null}
        setSelectedIncident={setSelectedIncident}
        simActive={true}
        setSimActive={setSimActive}
        navigationPath={null}
        setNavigationPath={setNavigationPath}
        handleSendFanMessage={handleSendFanMessage}
        handleAutoDispatch={handleAutoDispatch}
      />
    );

    // Find taco stand gate/facility bubble
    const facilityNode = screen.getByRole('button', { name: /Taco World Express/i });
    fireEvent.click(facilityNode);

    expect(setSelectedFacility).toHaveBeenCalledWith(mockFacilities[0]);
  });

  it('should trigger setSelectedIncident when clicking on pending incidents', () => {
    const setSelectedFacility = vi.fn();
    const setSelectedIncident = vi.fn();
    const setSimActive = vi.fn();
    const setNavigationPath = vi.fn();
    const handleSendFanMessage = vi.fn();
    const handleAutoDispatch = vi.fn();

    render(
      <MapDisplay
        facilities={mockFacilities}
        gates={mockGates}
        incidents={mockIncidents}
        users={mockUsers}
        role="volunteer"
        selectedFacility={null}
        setSelectedFacility={setSelectedFacility}
        selectedIncident={null}
        setSelectedIncident={setSelectedIncident}
        simActive={true}
        setSimActive={setSimActive}
        navigationPath={null}
        setNavigationPath={setNavigationPath}
        handleSendFanMessage={handleSendFanMessage}
        handleAutoDispatch={handleAutoDispatch}
      />
    );

    // Find incident bubble by severity warning label
    const incidentNode = screen.getByRole('button', { name: /Incident reported: Water leak/i });
    fireEvent.click(incidentNode);

    expect(setSelectedIncident).toHaveBeenCalledWith(mockIncidents[0]);
  });

});
