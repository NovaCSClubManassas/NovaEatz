// Simple unit test for to24Hour function
// Import the function from populate.js

// First, we need to extract the function or make it exportable
// For now, let's copy the function here for testing

function to24Hour(timeStr) {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":");
  
    hours = parseInt(hours, 10);
  
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
  
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }
  
  // Simple test runner
  function runTests() {
    // ARRANGE: Define all test cases
    const tests = [
      {
        name: "Converts 1:30 PM to 13:30",
        input: "1:30 PM",
        expected: "13:30",
      },
      {
        name: "Converts 12:00 PM (noon) to 12:00",
        input: "12:00 PM",
        expected: "12:00",
      },
      {
        name: "Converts 12:00 AM (midnight) to 00:00",
        input: "12:00 AM",
        expected: "00:00",
      },
      {
        name: "Converts 11:45 AM to 11:45",
        input: "11:45 AM",
        expected: "11:45",
      },
      {
        name: "Converts 3:05 PM to 15:05",
        input: "3:05 PM",
        expected: "15:05",
      },
      {
        name: "Converts 9:00 AM to 09:00",
        input: "9:00 AM",
        expected: "09:00",
      },
    ];
  
    let passed = 0;
    let failed = 0;
  
    console.log("Running tests for to24Hour()...\n");
  
    tests.forEach((test) => {
    // ACT: Call the function you're testing
      const result = to24Hour(test.input);
      
      // ASSERT: Compare result to expected value
      const success = result === test.expected;
  
      if (success) {
        console.log(`PASS: ${test.name}`);
        console.log(`   Input: "${test.input}" -> Output: "${result}"\n`);
        passed++;
      } else {
        console.log(`FAIL: ${test.name}`);
        console.log(`   Input: "${test.input}"`);
        console.log(`   Expected: "${test.expected}"`);
        console.log(`   Got: "${result}"\n`);
        failed++;
      }
    });
  
    console.log(`Results: ${passed} passed, ${failed} failed`);
  }
  
  // Run the tests
  runTests();