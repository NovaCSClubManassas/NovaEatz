// Cases: 
// If past event -> past

// If happening now 
// If ending within 45 min
// If starting within hour
// If starting within 4 hour
// If starting later than 4 hour

// If happening within 7 days
// If happening between 7 and 30 days
// If happening later than 30 days

export async function loadAndTransformPuppetJson() {
  try {
    // this calls the puppet.json
    const response = await fetch("scripts/puppet.json");
    const events = await response.json();
    const now = new Date();

    const updated = events.map((event, index) => {
      let start = new Date(now);
      let end = new Date(now);

      switch (index) {
        case 0: // Past Event
          start.setDate(now.getDate() - 1);
          start.setHours(12, 0);
          end = new Date(start); end.setHours(13, 0);
          break;

        case 1: // Happening Now
          start.setMinutes(start.getMinutes() - 30);
          end.setMinutes(end.getMinutes() + 60);
          break;

        case 2: // Ending Soon (≤45 min)
          start.setHours(now.getHours() - 1);
          end.setMinutes(now.getMinutes() + 30);
          break;

        case 3: // Starting in <1 hour
          start.setMinutes(now.getMinutes() + 45);
          end = new Date(start); end.setHours(end.getHours() + 1);
          break;

        case 4: // Starting in <4 hours
          start.setHours(now.getHours() + 2);
          end = new Date(start); end.setHours(end.getHours() + 1);
          break;

        case 5: // Starting later today (>4h)
          start.setHours(now.getHours() + 5);
          end = new Date(start); end.setHours(end.getHours() + 1);
          break;

        case 6: // Within 7 days
          start.setDate(now.getDate() + 5);
          start.setHours(14, 0);
          end = new Date(start); end.setHours(16, 0);
          break;

        case 7: // Within 30 days
          start.setDate(now.getDate() + 13);
          start.setHours(14, 0);
          end = new Date(start); end.setHours(16, 0);
          break;

        case 8: // >30 days
          start.setDate(now.getDate() + 32);
          start.setHours(14, 0);
          end = new Date(start); end.setHours(16, 0);
          break;

        default:
          console.warn("Extra puppet.json event detected — leaving untouched.");
      }
      return {
        ...event,
        DATE: start.toLocaleDateString("en-CA", { timeZone: "America/New_York" }),// This is important! This is in the east coast time zone!
        STARTTIME: start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        ENDTIME: end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        FIREBASETIME: start.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZoneName: "short",
        }),
      };
    });

    console.log("UPDATED PUPPET JSON:", updated);
    return updated;

  } catch (error) {
    console.error("Error loading puppet.json:", error);
    return [];
  }
}
