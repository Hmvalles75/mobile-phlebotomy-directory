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
  // Priority: cities > regions > states
  if (coverage.cities && coverage.cities.length > 0) {
    if (coverage.cities.length <= 3) {
      return formatCityNames(coverage.cities);
    } else {
      return `${formatCityNames(coverage.cities.slice(0, 2))} + ${coverage.cities.length - 2} more cities`;
    }
  }
  
  if (coverage.regions && coverage.regions.length > 0) {
    return formatRegionNames(coverage.regions);
  }
  
  return `Statewide ${formatStateNames(coverage.states)}`;
}