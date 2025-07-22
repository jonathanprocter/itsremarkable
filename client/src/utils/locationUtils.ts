/**
 * Utility functions for handling appointment location data
 */

export type LocationValue = 'woodbury' | 'rvc' | 'telehealth' | null;

export interface LocationDisplay {
  icon: string;
  name: string;
  display: string;
}

/**
 * Map database location values to display format
 */
export const getLocationDisplay = (location: LocationValue): LocationDisplay | null => {
  if (!location) return null;

  switch (location) {
    case 'woodbury':
      return {
        icon: '🏢',
        name: 'Woodbury',
        display: '🏢 Woodbury'
      };
    case 'rvc':
      return {
        icon: '🏥',
        name: 'RVC',
        display: '🏥 RVC'
      };
    case 'telehealth':
      return {
        icon: '💻',
        name: 'Telehealth',
        display: '💻 Telehealth'
      };
    default:
      return null;
  }
};

/**
 * Validate location value
 */
export const isValidLocation = (location: string): location is LocationValue => {
  return location === 'woodbury' || location === 'rvc' || location === 'telehealth';
};

/**
 * Get all available location options
 */
export const getLocationOptions = (): LocationDisplay[] => {
  return [
    { icon: '🏢', name: 'Woodbury', display: '🏢 Woodbury' },
    { icon: '🏥', name: 'RVC', display: '🏥 RVC' },
    { icon: '💻', name: 'Telehealth', display: '💻 Telehealth' }
  ];
};