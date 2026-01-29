// Unit tests for populate.js functions
// Import functions (using ES6 modules - adjust if needed)

// Mock functions for testing
function truncateByWords(text, maxWords) {
  // Handle null/undefined by returning empty string
  if (text == null) return "";
  
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

function getTodaystart() {
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return startDay;
}

function to24Hour(timeStr) {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  hours = parseInt(hours, 10);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function makeDate(dateStr, timeStr) {
  return new Date(`${dateStr}T${to24Hour(timeStr)}`);
}

function GetEventStatus(start, end, strStart, strEnd) {
  const now = new Date();
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const nowTs = now.getTime();
  const startTs = start.getTime();
  const endTs = end.getTime();

  //past event
  if (endDate < today) return { status: "past" };

  // Future event on future day
  if (startDate > today) {
    const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    let label;
    let day;
    if (diffDays <= 7) {
      day = start.toLocaleDateString("en-US", { weekday: "long" });
    } else if (diffDays <= 30) {
      day = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      day = start.toLocaleDateString();
    }
    return { status: "future", color: "red", blink: false, label: `${day} from ${strStart} to ${strEnd}` };
  }
  
  // Event is today:
  // Ended earlier TODAY
  if (nowTs > endTs) return { status: "past" };

  // Happening NOW and warning if event is closing in 30 minutes
  if (nowTs >= startTs && nowTs <= endTs) {
    const timeLeft = Math.ceil((endTs - nowTs) / (60 * 1000));
    const closingSoon = timeLeft <= 45;

    if (closingSoon) {
      return { status: "endingsoon", color: "green", blink: true, label: `Ending soon in ${timeLeft} minutes (today from ${strStart} to ${strEnd})` };
    }

    return { status: "now", color: "green", blink: false, label: `Happening now (today from ${strStart} to ${strEnd})` };
  }

  // Later TODAY
  if (nowTs < startTs) {
    const timetill = Math.ceil((startTs - nowTs) / (60 * 60 * 1000));
    const openingsoon = timetill <= 4;
    if (openingsoon) {
      const openingwithinhour = timetill <= 1;
      if (openingwithinhour) {
        return { status: "upcoming", color: "orange", blink: true, label: `Starts in ${Math.ceil((startTs - nowTs) / (60 * 1000))} minutes (today from ${strStart} to ${strEnd})` };
      }
      return { status: "upcoming", color: "orange", blink: true, label: `Starts in ${timetill} hours (today from ${strStart} to ${strEnd})` };
    }
    return { status: "upcoming", color: "orange", blink: false, label: `Starts in ${timetill} hours (today from ${strStart} to ${strEnd})` };
  }

  return { status: "unknown" };
}

function filterEventsByCampus(events, selectedCampus) {
  if (!selectedCampus || selectedCampus.trim() === '') {
    return events;
  }
  return events.filter(event => {
    const eventCampus = (event.CAMPUS || '').trim();
    return eventCampus.toLowerCase() === selectedCampus.toLowerCase();
  });
}

// Test runner
function runTests() {
  let passed = 0;
  let failed = 0;

  console.log("Running tests for populate.js functions...\n");

  // Test truncateByWords
  console.log("Testing truncateByWords()\n");

  const truncateTests = [
    {
      name: "Returns full text when under word limit",
      input: { text: "Short text", maxWords: 10 },
      expected: "Short text"
    },
    {
      name: "Truncates text when over word limit",
      input: { text: "This is a very long text that should be truncated", maxWords: 5 },
      expected: "This is a very long…"
    },
    {
      name: "Handles empty string",
      input: { text: "", maxWords: 10 },
      expected: ""
    },
    {
      name: "Handles null/undefined",
      input: { text: null, maxWords: 10 },
      expected: ""
    },
    {
      name: "Handles exactly max words",
      input: { text: "One two three four five", maxWords: 5 },
      expected: "One two three four five"
    }
  ];

  truncateTests.forEach(test => {
    const result = truncateByWords(test.input.text, test.input.maxWords);
    const success = result === test.expected;
    if (success) {
      console.log(`PASS: ${test.name}`);
      console.log(`   Input: "${test.input.text}" (max ${test.input.maxWords} words) -> Output: "${result}"\n`);
      passed++;
    } else {
      console.log(`FAIL: ${test.name}`);
      console.log(`   Input: "${test.input.text}" (max ${test.input.maxWords} words)`);
      console.log(`   Expected: "${test.expected}"`);
      console.log(`   Got: "${result}"\n`);
      failed++;
    }
  });

  // Test getTodaystart
  console.log("Testing getTodaystart()\n");

  const todayStart = getTodaystart();
  const now = new Date();
  const expectedTodayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayStartSuccess = todayStart.getTime() === expectedTodayStart.getTime() &&
                            todayStart.getHours() === 0 &&
                            todayStart.getMinutes() === 0 &&
                            todayStart.getSeconds() === 0;

  if (todayStartSuccess) {
    console.log(`PASS: getTodaystart returns today at 00:00:00`);
    console.log(`   Output: ${todayStart}\n`);
    passed++;
  } else {
    console.log(`FAIL: getTodaystart`);
    console.log(`   Expected: ${expectedTodayStart}`);
    console.log(`   Got: ${todayStart}\n`);
    failed++;
  }

  // Test GetEventStatus - Past event
  console.log("Testing GetEventStatus()\n");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const pastStart = makeDate(yesterday.toISOString().split('T')[0], "10:00 AM");
  const pastEnd = makeDate(yesterday.toISOString().split('T')[0], "12:00 PM");
  const pastStatus = GetEventStatus(pastStart, pastEnd, "10:00 AM", "12:00 PM");
  
  if (pastStatus.status === "past") {
    console.log(`PASS: Past event returns status "past"`);
    passed++;
  } else {
    console.log(`FAIL: Past event should return status "past"`);
    console.log(`   Got: ${pastStatus.status}\n`);
    failed++;
  }

  // Test GetEventStatus - Future event
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const futureStart = makeDate(tomorrow.toISOString().split('T')[0], "10:00 AM");
  const futureEnd = makeDate(tomorrow.toISOString().split('T')[0], "12:00 PM");
  const futureStatus = GetEventStatus(futureStart, futureEnd, "10:00 AM", "12:00 PM");
  
  if (futureStatus.status === "future" && futureStatus.color === "red") {
    console.log(`PASS: Future event returns status "future"`);
    passed++;
  } else {
    console.log(`FAIL: Future event should return status "future"`);
    console.log(`   Got: ${futureStatus.status}\n`);
    failed++;
  }

  // Test filterEventsByCampus
  console.log("Testing filterEventsByCampus()\n");

  const testEvents = [
    { CAMPUS: "Main", EVENTNAME: "Event 1" },
    { CAMPUS: "North", EVENTNAME: "Event 2" },
    { CAMPUS: "Main", EVENTNAME: "Event 3" },
    { CAMPUS: "South", EVENTNAME: "Event 4" }
  ];

  const filterTests = [
    {
      name: "Returns all events when campus is empty",
      input: { events: testEvents, campus: "" },
      expectedLength: 4
    },
    {
      name: "Filters by Main campus (case-sensitive match)",
      input: { events: testEvents, campus: "Main" },
      expectedLength: 2
    },
    {
      name: "Case-insensitive filtering",
      input: { events: testEvents, campus: "main" },
      expectedLength: 2
    },
    {
      name: "Returns empty array for non-existent campus",
      input: { events: testEvents, campus: "East" },
      expectedLength: 0
    }
  ];

  filterTests.forEach(test => {
    const result = filterEventsByCampus(test.input.events, test.input.campus);
    const success = result.length === test.expectedLength;
    if (success) {
      console.log(`PASS: ${test.name}`);
      console.log(`   Campus: "${test.input.campus}" -> Found ${result.length} events\n`);
      passed++;
    } else {
      console.log(`FAIL: ${test.name}`);
      console.log(`   Campus: "${test.input.campus}"`);
      console.log(`   Expected: ${test.expectedLength} events`);
      console.log(`   Got: ${result.length} events\n`);
      failed++;
    }
  });

  console.log(`Results: ${passed} passed, ${failed} failed`);
}

// Run the tests
runTests();
