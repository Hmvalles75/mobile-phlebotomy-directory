// Calculate distance between ZIP codes using approximate lat/lng
// ZIP 91773 (San Dimas, CA): ~34.1067° N, -117.8067° W
// ZIP 90017 (Downtown LA): ~34.0522° N, -118.2437° W

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

console.log('📍 Distance Calculation:\n')
console.log('From: ZIP 91773 (San Dimas, CA)')
console.log('To:   ZIP 90017 (Downtown Los Angeles)\n')

const distance = haversineDistance(34.1067, -117.8067, 34.0522, -118.2437)
console.log(`Distance: ${distance.toFixed(2)} miles`)
console.log(`\nWill show with 35 mile radius? ${distance <= 35 ? '✅ YES' : '❌ NO'}`)
console.log(`Will show with 100 mile radius? ${distance <= 100 ? '✅ YES' : '❌ NO'}`)
