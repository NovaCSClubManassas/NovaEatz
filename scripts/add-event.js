import {db, analytics, getDocs, collection, addDoc} from "./firebase.js";
import { makeDate,to24Hour } from "./time-format.js";
//Small helper to get input values
const val = (id) => document.getElementById(id).value;

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