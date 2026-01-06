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

  
  // WORD LIMIT VALIDATION
  // Stop submission if limits exceeded
  if (countWords(eventName) > MAX_NAME_WORDS) {
    alert(`Event name is too long (max ${MAX_NAME_WORDS} words).`);
    return;
  }

  if (countWords(description) > MAX_DESC_WORDS) {
    alert(`Event description is too long (max ${MAX_DESC_WORDS} words).`);
    return;
  }


});


//Form submit handler, gets the input values and formats them, then adds the event to the database
document.getElementById('event-form').addEventListener('submit', async (e) => {  //
  e.preventDefault(); //prevents from reloading the page 

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
    window.location.href = 'index.html';
    document.getElementById('event-form').reset();
  } catch (error) {
    console.error('Error adding event:', error);
    alert('Failed to add event. Please try again.');
  }
});