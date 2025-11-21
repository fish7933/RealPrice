// Quick script to check KASHGAR destination in browser storage
console.log("Please run this in browser console:");
console.log(`
// Check all destinations
const destinations = JSON.parse(localStorage.getItem('destinations') || '[]');
console.log('All destinations:', destinations);
const kashgar = destinations.find(d => d.name.includes('KASHGAR'));
console.log('KASHGAR destination:', kashgar);

// Check truck freights for KASHGAR
const truckFreights = JSON.parse(localStorage.getItem('borderDestinationFreights') || '[]');
const kashgarTrucks = truckFreights.filter(t => t.destinationId === kashgar?.id);
console.log('Truck freights for KASHGAR:', kashgarTrucks);
`);
