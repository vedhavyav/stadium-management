import { describe, it, expect } from 'vitest';
import { 
  calculateDistance, 
  getClosestAvailableVolunteer, 
  simulateStadiumChanges,
  INITIAL_FACILITIES,
  INITIAL_GATES
} from '../data/mockDb';
import { User, Incident } from '../types';

describe('mockDb Utility module tests', () => {
  
  it('should accurately calculate 2D Euclidean distance', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 }; // 3-4-5 triangle
    expect(calculateDistance(p1, p2)).toBe(5);
  });

  it('should identify the closest active non-busy volunteer', () => {
    // Mock volunteers
    const volunteers: User[] = [
      {
        id: "VOL-1",
        email: "v1@test.com",
        name: "Volunteer 1",
        role: "volunteer",
        status: "active",
        currentLocation: { zone: "North", x: 10, y: 10 },
        languagePref: "en"
      },
      {
        id: "VOL-2",
        email: "v2@test.com",
        name: "Volunteer 2",
        role: "volunteer",
        status: "active",
        currentLocation: { zone: "South", x: 90, y: 90 },
        languagePref: "en"
      }
    ];

    // Mock incidents list (empty, so all volunteers are available)
    const activeIncidents: Incident[] = [];

    // Target coordinate close to Volunteer 1 (x:10, y:10)
    const incidentCoords = { x: 12, y: 12 };

    const closest = getClosestAvailableVolunteer(incidentCoords, volunteers, activeIncidents);
    expect(closest).not.toBeNull();
    expect(closest?.id).toBe("VOL-1");
  });

  it('should ignore busy or break status volunteers', () => {
    const volunteers: User[] = [
      {
        id: "VOL-1",
        email: "v1@test.com",
        name: "Volunteer 1",
        role: "volunteer",
        status: "on_break", // ON BREAK!
        currentLocation: { zone: "North", x: 10, y: 10 },
        languagePref: "en"
      },
      {
        id: "VOL-2",
        email: "v2@test.com",
        name: "Volunteer 2",
        role: "volunteer",
        status: "active",
        currentLocation: { zone: "South", x: 90, y: 90 },
        languagePref: "en"
      }
    ];

    const activeIncidents: Incident[] = [];
    const incidentCoords = { x: 12, y: 12 };

    const closest = getClosestAvailableVolunteer(incidentCoords, volunteers, activeIncidents);
    expect(closest?.id).toBe("VOL-2"); // Reroutes to Volunteer 2 since 1 is on break
  });

  it('should fluctuate concession wait times and gate flows in simulator', () => {
    const initialFacs = [...INITIAL_FACILITIES];
    const initialGates = [...INITIAL_GATES];

    const result = simulateStadiumChanges(initialFacs, initialGates);

    expect(result.facilities.length).toBe(initialFacs.length);
    expect(result.gates.length).toBe(initialGates.length);

    // Verify some values changed
    const anyWaitTimeChanged = result.facilities.some((f, i) => f.waitTimeMins !== initialFacs[i].waitTimeMins);
    const anyFlowRateChanged = result.gates.some((g, i) => g.flowRateIn !== initialGates[i].flowRateIn);

    // Some changes should occur randomly
    expect(anyWaitTimeChanged || anyFlowRateChanged).toBe(true);
  });

});
