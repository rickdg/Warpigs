/**
 * Warpigs Schedule Data
 * Stored as a global configuration script to allow simple file:// protocol usage without CORS issues.
 */
const DEFAULT_WARPIGS_SCHEDULE = [
  { date: "FRI · MAY 1", venue: "Lagunitas Tap Room", city: "Petaluma", time: "4–8pm" },
  { date: "SAT · MAY 9", venue: "Windsor Town Green", city: "Windsor", time: "12–7pm" },
  { date: "THU · MAY 14", venue: "Cotati Brewing Co.", city: "Cotati", time: "5–9pm" },
  { date: "SAT · MAY 23", venue: "Private Catering", city: "Sonoma", time: "Booked" },
  { date: "FRI · MAY 29", venue: "HenHouse Brewing", city: "Santa Rosa", time: "4–8pm" }
];

function getWarpigsSchedule() {
  const local = localStorage.getItem('warpigs_schedule');
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Error parsing local storage schedule:', e);
    }
  }
  return DEFAULT_WARPIGS_SCHEDULE;
}
