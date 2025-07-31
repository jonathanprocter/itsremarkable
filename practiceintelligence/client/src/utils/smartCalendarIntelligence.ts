/**
 * Smart Calendar Intelligence System
 * Provides conflict detection, travel time calculations, and scheduling optimization
 */

export interface ConflictDetection {
  type: 'overlap' | 'travel_time' | 'double_booking' | 'break_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedResolution: string;
  conflictingEvents: any[];
}

export interface TravelTimeCalculation {
  fromLocation: string;
  toLocation: string;
  estimatedMinutes: number;
  bufferTimeNeeded: number;
  suggestedDeparture: Date;
}

export class SmartCalendarIntelligence {
  // Location coordinates for travel time calculation
  private static locationCoordinates: Record<string, { lat: number; lng: number }> = {
    'woodbury': { lat: 40.8176, lng: -73.2090 },
    'rvc': { lat: 40.6623, lng: -73.6407 },
    'telehealth': { lat: 0, lng: 0 } // No travel needed
  };

  /**
   * Detect scheduling conflicts for a new or modified appointment
   */
  static async detectConflicts(
    newEvent: {
      startTime: Date;
      endTime: Date;
      location?: string;
      id?: string;
    },
    existingEvents: any[]
  ): Promise<ConflictDetection[]> {
    const conflicts: ConflictDetection[] = [];

    for (const event of existingEvents) {
      // Skip comparing with itself
      if (newEvent.id && event.id === newEvent.id) continue;

      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Check for time overlap
      if (this.hasTimeOverlap(newEvent.startTime, newEvent.endTime, eventStart, eventEnd)) {
        conflicts.push({
          type: 'overlap',
          severity: 'critical',
          message: `Appointment overlaps with "${event.title}"`,
          suggestedResolution: `Reschedule one appointment to avoid conflict`,
          conflictingEvents: [event]
        });
      }

      // Check for travel time conflicts
      if (newEvent.location && event.location && newEvent.location !== event.location) {
        const travelTime = this.calculateTravelTime(event.location, newEvent.location);
        const timeBetween = (newEvent.startTime.getTime() - eventEnd.getTime()) / (1000 * 60); // minutes

        if (timeBetween < travelTime.estimatedMinutes + travelTime.bufferTimeNeeded) {
          conflicts.push({
            type: 'travel_time',
            severity: 'high',
            message: `Insufficient travel time from ${event.location} to ${newEvent.location}`,
            suggestedResolution: `Allow ${travelTime.estimatedMinutes + travelTime.bufferTimeNeeded} minutes travel time`,
            conflictingEvents: [event]
          });
        }
      }
    }

    // Check for back-to-back appointments without breaks
    const adjacentEvents = this.findAdjacentEvents(newEvent, existingEvents);
    for (const adjacent of adjacentEvents) {
      const timeBetween = Math.abs(
        (new Date(adjacent.startTime).getTime() - newEvent.endTime.getTime()) / (1000 * 60)
      );

      if (timeBetween < 15) { // Less than 15 minutes between appointments
        conflicts.push({
          type: 'break_violation',
          severity: 'medium',
          message: `Less than 15 minutes between appointments`,
          suggestedResolution: `Consider adding buffer time for preparation and notes`,
          conflictingEvents: [adjacent]
        });
      }
    }

    return conflicts;
  }

  /**
   * Calculate travel time between two locations
   */
  static calculateTravelTime(fromLocation: string, toLocation: string): TravelTimeCalculation {
    // If either location is telehealth, no travel time needed
    if (fromLocation === 'telehealth' || toLocation === 'telehealth') {
      return {
        fromLocation,
        toLocation,
        estimatedMinutes: 0,
        bufferTimeNeeded: 5, // Small buffer for tech setup
        suggestedDeparture: new Date()
      };
    }

    // Predefined travel times between locations
    const travelTimes: Record<string, Record<string, number>> = {
      'woodbury': {
        'rvc': 45,
        'woodbury': 0
      },
      'rvc': {
        'woodbury': 45,
        'rvc': 0
      }
    };

    const estimatedMinutes = travelTimes[fromLocation]?.[toLocation] || 30; // Default 30 min
    const bufferTimeNeeded = estimatedMinutes > 0 ? 15 : 0; // 15 min buffer for travel

    return {
      fromLocation,
      toLocation,
      estimatedMinutes,
      bufferTimeNeeded,
      suggestedDeparture: new Date()
    };
  }

  /**
   * Suggest optimal appointment times based on existing schedule
   */
  static suggestOptimalTimes(
    date: Date,
    duration: number, // in minutes
    existingEvents: any[],
    preferences: {
      preferredStartTime?: string; // "09:00"
      preferredEndTime?: string;   // "17:00"
      minimumBreak?: number;       // minutes
      location?: string;
    } = {}
  ): Date[] {
    const suggestions: Date[] = [];
    const dayStart = new Date(date);
    dayStart.setHours(
      preferences.preferredStartTime ? parseInt(preferences.preferredStartTime.split(':')[0]) : 9,
      preferences.preferredStartTime ? parseInt(preferences.preferredStartTime.split(':')[1]) : 0,
      0, 0
    );

    const dayEnd = new Date(date);
    dayEnd.setHours(
      preferences.preferredEndTime ? parseInt(preferences.preferredEndTime.split(':')[0]) : 17,
      preferences.preferredEndTime ? parseInt(preferences.preferredEndTime.split(':')[1]) : 0,
      0, 0
    );

    // Sort existing events by start time
    const sortedEvents = existingEvents
      .filter(event => new Date(event.startTime).toDateString() === date.toDateString())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    let currentTime = new Date(dayStart);
    const minimumBreak = preferences.minimumBreak || 15;

    for (const event of sortedEvents) {
      const eventStart = new Date(event.startTime);
      const availableTime = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60);

      // Check if there's enough time for the appointment
      if (availableTime >= duration + minimumBreak) {
        suggestions.push(new Date(currentTime));
      }

      // Update current time to end of this event plus break
      currentTime = new Date(new Date(event.endTime).getTime() + minimumBreak * 60 * 1000);
    }

    // Check if there's time after the last appointment
    const remainingTime = (dayEnd.getTime() - currentTime.getTime()) / (1000 * 60);
    if (remainingTime >= duration) {
      suggestions.push(new Date(currentTime));
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Generate recurring appointment suggestions
   */
  static generateRecurringSchedule(
    baseAppointment: {
      startTime: Date;
      duration: number;
      location?: string;
    },
    recurrenceRule: {
      frequency: 'weekly' | 'biweekly' | 'monthly';
      count: number;
    },
    existingEvents: any[]
  ): Array<{ date: Date; conflicts: ConflictDetection[] }> {
    const schedule: Array<{ date: Date; conflicts: ConflictDetection[] }> = [];
    let currentDate = new Date(baseAppointment.startTime);

    for (let i = 0; i < recurrenceRule.count; i++) {
      const appointmentEnd = new Date(
        currentDate.getTime() + baseAppointment.duration * 60 * 1000
      );

      const conflicts = this.detectConflicts(
        {
          startTime: currentDate,
          endTime: appointmentEnd,
          location: baseAppointment.location
        },
        existingEvents
      );

      schedule.push({
        date: new Date(currentDate),
        conflicts: conflicts
      });

      // Calculate next occurrence
      switch (recurrenceRule.frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    return schedule;
  }

  // Helper methods
  private static hasTimeOverlap(
    start1: Date, end1: Date, start2: Date, end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  private static findAdjacentEvents(
    newEvent: { startTime: Date; endTime: Date },
    existingEvents: any[]
  ): any[] {
    return existingEvents.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      // Check if events are adjacent (within 30 minutes)
      const timeDiff1 = Math.abs(eventStart.getTime() - newEvent.endTime.getTime()) / (1000 * 60);
      const timeDiff2 = Math.abs(eventEnd.getTime() - newEvent.startTime.getTime()) / (1000 * 60);
      
      return timeDiff1 <= 30 || timeDiff2 <= 30;
    });
  }
}