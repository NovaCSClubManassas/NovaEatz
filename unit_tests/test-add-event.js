// Unit tests for add-event.js functions

// Mock functions for testing
function countWords(text) {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

function validateField(field) {
  const fieldType = field.tagName.toLowerCase();
  let isValid = true;
  let value = '';

  if (fieldType === 'input') {
    const inputType = field.type;
    if (inputType === 'checkbox') {
      isValid = field.checked;
    } else {
      value = field.value.trim();
      isValid = value !== '';
    }
  } else if (fieldType === 'textarea') {
    value = field.value.trim();
    isValid = value !== '';
  } else if (fieldType === 'select') {
    value = field.value;
    isValid = value !== '' && value !== null;
  }

  return isValid;
}

// Helper to create mock DOM elements
function createMockInput(type = 'text', value = '', checked = false) {
  const input = {
    tagName: 'INPUT',
    type: type,
    value: value,
    checked: checked,
    trim: function() { return this.value.trim(); }
  };
  return input;
}

function createMockTextarea(value = '') {
  const textarea = {
    tagName: 'TEXTAREA',
    value: value,
    trim: function() { return this.value.trim(); }
  };
  return textarea;
}

function createMockSelect(value = '') {
  const select = {
    tagName: 'SELECT',
    value: value
  };
  return select;
}

// Test runner
function runTests() {
  let passed = 0;
  let failed = 0;

  console.log("Running tests for add-event.js functions...\n");

  // Test countWords
  console.log("Testing countWords()\n");

  const countWordsTests = [
    {
      name: "Counts words in simple sentence",
      input: "Hello world",
      expected: 2
    },
    {
      name: "Handles empty string",
      input: "",
      expected: 0
    },
    {
      name: "Handles string with only spaces",
      input: "   ",
      expected: 0
    },
    {
      name: "Counts multiple words",
      input: "This is a test sentence",
      expected: 5
    },
    {
      name: "Handles extra spaces between words",
      input: "Word1    Word2   Word3",
      expected: 3
    },
    {
      name: "Handles single word",
      input: "Hello",
      expected: 1
    },
    {
      name: "Trims leading and trailing spaces",
      input: "  Hello world  ",
      expected: 2
    }
  ];

  countWordsTests.forEach(test => {
    const result = countWords(test.input);
    const success = result === test.expected;
    if (success) {
      console.log(`PASS: ${test.name}`);
      console.log(`   Input: "${test.input}" -> Output: ${result}\n`);
      passed++;
    } else {
      console.log(`FAIL: ${test.name}`);
      console.log(`   Input: "${test.input}"`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Got: ${result}\n`);
      failed++;
    }
  });

  // Test validateField
  console.log("Testing validateField()\n");

  const validateTests = [
    {
      name: "Validates text input with value",
      input: createMockInput('text', 'Hello'),
      expected: true
    },
    {
      name: "Rejects empty text input",
      input: createMockInput('text', ''),
      expected: false
    },
    {
      name: "Rejects text input with only spaces",
      input: createMockInput('text', '   '),
      expected: false
    },
    {
      name: "Validates checked checkbox",
      input: createMockInput('checkbox', '', true),
      expected: true
    },
    {
      name: "Rejects unchecked checkbox",
      input: createMockInput('checkbox', '', false),
      expected: false
    },
    {
      name: "Validates textarea with value",
      input: createMockTextarea('Some text'),
      expected: true
    },
    {
      name: "Rejects empty textarea",
      input: createMockTextarea(''),
      expected: false
    },
    {
      name: "Validates select with value",
      input: createMockSelect('option1'),
      expected: true
    },
    {
      name: "Rejects empty select",
      input: createMockSelect(''),
      expected: false
    },
    {
      name: "Rejects select with null value",
      input: createMockSelect(null),
      expected: false
    }
  ];

  validateTests.forEach(test => {
    const result = validateField(test.input);
    const success = result === test.expected;
    if (success) {
      console.log(`PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`FAIL: ${test.name}`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Got: ${result}\n`);
      failed++;
    }
  });

  console.log(`Results: ${passed} passed, ${failed} failed`);
}

// Run the tests
runTests();
