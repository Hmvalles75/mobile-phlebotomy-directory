// Coverage display utilities

export function formatRegionName(slug: string): string {
  // Convert kebab-case slugs to proper title case
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatRegionNames(regionSlugs: string[]): string {
  return regionSlugs
    .map(slug => formatRegionName(slug))
    .join(', ');
}

export function formatCityNames(cities: string[]): string {
  return cities.join(', ');
}

export function formatStateNames(states: string[]): string {
  return states.join(', ');
}

// Main coverage display function for UI components
export function formatCoverageDisplay(coverage: {
  regions?: string[];
  cities?: string[];
  states: string[];
}): string {
  // Helper to get state abbreviation
  const getStateAbbr = () => {
    if (coverage.states && coverage.states.length > 0) {
      return coverage.states[0];
    }
    return '';
  };

  // Priority: cities > regions > states
  if (coverage.cities && coverage.cities.length > 0) {
    const stateAbbr = getStateAbbr();
    const stateStr = stateAbbr ? `, ${stateAbbr}` : '';

    if (coverage.cities.length <= 3) {
      return `${formatCityNames(coverage.cities)}${stateStr}`;
    } else {
      return `${formatCityNames(coverage.cities.slice(0, 2))}${stateStr} + ${coverage.cities.length - 2} more cities`;
    }
  }

  if (coverage.regions && coverage.regions.length > 0) {
    const stateAbbr = getStateAbbr();
    const stateStr = stateAbbr ? `, ${stateAbbr}` : '';
    return `${formatRegionNames(coverage.regions)}${stateStr}`;
  }

  return `Statewide ${formatStateNames(coverage.states)}`;
}