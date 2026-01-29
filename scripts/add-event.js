import {db, analytics, getDocs, collection, addDoc} from "./firebase.js";
import { makeDate,to24Hour } from "./time-format.js";
//Small helper to get input values
const val = (id) => document.getElementById(id).value;

const MAX_NAME_WORDS = 10;     // Max words for event name
const MAX_DESC_WORDS = 40;     // Max words for description

// Counts how many words are in a string
// Extra spaces are ignored
const countWords = (text) =>
  text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

// Updates the word counter text under an input
// Turns red if the limit is exceeded
const setCounter = (inputEl, counterEl, maxWords) => {
  if (!inputEl || !counterEl) return;

  const words = countWords(inputEl.value);
  counterEl.textContent = `${words}/${maxWords} words`;

  // Add red warning style if over limit
  counterEl.classList.toggle("over", words > maxWords);
};


// LIVE WORD COUNTERS
// Runs when the page loads

document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("event-name");
  const descInput = document.getElementById("description");

  const nameCounter = document.getElementById("event-name-count");
  const descCounter = document.getElementById("description-count");

  // Show initial word counts
  setCounter(nameInput, nameCounter, MAX_NAME_WORDS);
  setCounter(descInput, descCounter, MAX_DESC_WORDS);

  // Update counters as the user types
  nameInput.addEventListener("input", () =>
    setCounter(nameInput, nameCounter, MAX_NAME_WORDS)
  );

  descInput.addEventListener("input", () =>
    setCounter(descInput, descCounter, MAX_DESC_WORDS)
  );
});


// FORM SUBMISSION HANDLER

document.getElementById('event-form').addEventListener('submit', async (e) => {
  e.preventDefault(); // Stop page from refreshing

  // Get values from the form
  const eventName = val('event-name');
  const freefood = val('free-food');
  const description = val('description');

  
  // Word limit validation is now handled in validateField function
  // No need for separate checks here
});


// Track which fields have been interacted with
const touchedFields = new Set();

// Mark a field as touched (user has interacted with it)
function markFieldTouched(field) {
  touchedFields.add(field.id || field.name);
}

// Check if a field has been touched
function isFieldTouched(field) {
  return touchedFields.has(field.id || field.name);
}

// Custom validation UI functions
// Validation is handled entirely in JavaScript, not relying on HTML required attributes

/**
 * Validates a single field and returns { isValid: boolean, errorMessage: string }
 */
function validateField(field) {
  const fieldType = field.tagName.toLowerCase();
  let isValid = true;
  let errorMessage = '';
  let value = '';

  if (fieldType === 'input') {
    const inputType = field.type;
    if (inputType === 'checkbox') {
      isValid = field.checked;
      if (!isValid) {
        errorMessage = 'This field is required';
      }
    } else {
      value = field.value.trim();
      isValid = value !== '';
      if (!isValid) {
        errorMessage = 'This field is required';
      } else {
        // Check word limits for event name
        if (field.id === 'event-name') {
          const wordCount = countWords(value);
          if (wordCount > MAX_NAME_WORDS) {
            isValid = false;
            errorMessage = `Event name is too long (max ${MAX_NAME_WORDS} words)`;
          }
        }
      }
    }
  } else if (fieldType === 'textarea') {
    value = field.value.trim();
    isValid = value !== '';
    if (!isValid) {
      errorMessage = 'This field is required';
    } else {
      // Check word limits for description
      if (field.id === 'description') {
        const wordCount = countWords(value);
        if (wordCount > MAX_DESC_WORDS) {
          isValid = false;
          errorMessage = `Description is too long (max ${MAX_DESC_WORDS} words)`;
        }
      }
    }
  } else if (fieldType === 'select') {
    value = field.value;
    isValid = value !== '' && value !== null && value !== undefined;
    if (!isValid) {
      errorMessage = 'This field is required';
    }
  }

  return { isValid, errorMessage };
}

/**
 * Shows error UI for a field
 */
function showFieldError(field, errorMessage = 'This field is required') {
  // Only show error if field has been touched or we're validating on submit
  if (!isFieldTouched(field) && !field.dataset.validating) {
    return;
  }

  field.classList.add('field-error');
  
  // Check if error message already exists for this field
  const fieldId = field.id || field.name;
  const existingError = document.querySelector(`.error-text[data-field-id="${fieldId}"]`);
  if (existingError) {
    // Update existing error message
    existingError.innerHTML = `<span class="error-icon">⚠</span> ${errorMessage}`;
    return;
  }

  // Find the appropriate container for error message placement
  // For grouped fields (time inputs in .time-container), place error at the .date-time-group level
  const timeContainer = field.closest('.time-container');
  const dateTimeGroup = field.closest('.date-time-group');
  const targetContainer = timeContainer ? dateTimeGroup : (dateTimeGroup || field.parentElement);

  // Create and insert error message with warning icon
  const errorText = document.createElement('span');
  errorText.className = 'error-text';
  errorText.innerHTML = `<span class="error-icon">⚠</span> ${errorMessage}`;
  errorText.setAttribute('data-field-id', fieldId);
  
  // Insert at the end of the target container
  targetContainer.appendChild(errorText);
}

/**
 * Clears error UI for a field
 */
function clearFieldError(field) {
  field.classList.remove('field-error');
  
  // Remove error message associated with this field
  const fieldId = field.id || field.name;
  const errorText = document.querySelector(`.error-text[data-field-id="${fieldId}"]`);
  if (errorText) {
    errorText.remove();
  }
}

/**
 * List of required field IDs (no longer relying on HTML required attribute)
 */
const REQUIRED_FIELDS = [
  'event-name',
  'description',
  'event-date',
  'start-hour',
  'start-minute',
  'start-ampm',
  'end-hour',
  'end-minute',
  'end-ampm',
  'campus',
  'building',
  'room',
  'free-food'
];

/**
 * Validates all required fields in the form
 * Returns { isValid: boolean, firstInvalidField: HTMLElement | null }
 */
function validateForm(form, isSubmitAttempt = false) {
  let isValid = true;
  let firstInvalidField = null;

  // Mark all fields as validating on submit attempt
  if (isSubmitAttempt) {
    REQUIRED_FIELDS.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.dataset.validating = 'true';
        markFieldTouched(field); // Mark as touched on submit attempt
      }
    });
  }

  REQUIRED_FIELDS.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const validation = validateField(field);
    if (!validation.isValid) {
      isValid = false;
      if (!firstInvalidField) {
        firstInvalidField = field;
      }
      showFieldError(field, validation.errorMessage);
    } else {
      clearFieldError(field);
    }
  });

  // Clean up validating flags after validation
  if (isSubmitAttempt) {
    REQUIRED_FIELDS.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        delete field.dataset.validating;
      }
    });
  }

  return { isValid, firstInvalidField };
}

// Set up input/change listeners to mark fields as touched and validate
const form = document.getElementById('event-form');

REQUIRED_FIELDS.forEach(fieldId => {
  const field = document.getElementById(fieldId);
  if (!field) return;

  // Mark field as touched and validate on interaction
  field.addEventListener('input', () => {
    markFieldTouched(field);
    const validation = validateField(field);
    if (validation.isValid) {
      clearFieldError(field);
    } else {
      showFieldError(field, validation.errorMessage);
    }
  });
  
  field.addEventListener('change', () => {
    markFieldTouched(field);
    const validation = validateField(field);
    if (validation.isValid) {
      clearFieldError(field);
    } else {
      showFieldError(field, validation.errorMessage);
    }
  });

  // Mark as touched on blur (when user leaves the field)
  field.addEventListener('blur', () => {
    markFieldTouched(field);
    const validation = validateField(field);
    if (!validation.isValid) {
      showFieldError(field, validation.errorMessage);
    }
  });
});

//Form submit handler, gets the input values and formats them, then adds the event to the database
form.addEventListener('submit', async (e) => {  //
  e.preventDefault(); //prevents from reloading the page

  // Custom validation - block submission if form is invalid
  // Pass isSubmitAttempt=true to show errors for all invalid fields
  const validation = validateForm(form, true);
  if (!validation.isValid) {
    // Focus and scroll to first invalid field
    if (validation.firstInvalidField) {
      validation.firstInvalidField.focus();
      validation.firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return; // Stop submission
  } 

  const eventName = val('event-name');
  const freefood = val('free-food');
  const description = val('description');
  const eventDate = val('event-date');
  const startHour = val('start-hour');
  const startMinute = val('start-minute');
  const startAmPm = val('start-ampm');
  const endHour = val('end-hour');
  const endMinute = val('end-minute');
  const endAmPm = val('end-ampm');
  const campus = val('campus');
  const building = val('building');
  const room = val('room');


  const startTime = `${startHour}:${startMinute.padStart(2, '0')} ${startAmPm}`;
  const endTime = `${endHour}:${endMinute.padStart(2, '0')} ${endAmPm}`;
  // creating a digital timestamp in order for order sorting in firebase

  const firebaseTime = makeDate(eventDate,startTime);
  try {
    await addDoc(collection(db, 'events'), {
      EVENTNAME: eventName,
      CAMPUS: campus,
      BUILDING: building,
      ROOM: room,
      DATE: eventDate,
      STARTTIME: startTime,
      ENDTIME: endTime,
      DESCRIPTION: description,
      FREEFOOD: freefood,
      FLYERLINK: "", //not used right now
      TIMESTAMP: Date.now().toString(),
      /// IMPORTANT: this is used for querying and sorting order within database
      FIREBASETIME: firebaseTime,
      
    });

    alert('Event added successfully!');
    window.location.href = './index.html';
    document.getElementById('event-form').reset();
  } catch (error) {
    console.error('Error adding event:', error);
    alert('Failed to add event. Please try again.');
  }
});