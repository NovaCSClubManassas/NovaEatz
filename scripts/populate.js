import { db, getDocs, collection, query, where, orderBy } from "./firebase.js";
import { makeDate} from "./time-format.js";
import {devMode} from "../utilities/devmode.js"
import {loadAndTransformPuppetJson} from "./puppet-json.js"

// These control how much text shows on each card

const CARD_TITLE_MAX_WORDS = 10;
const CARD_DESC_MAX_WORDS = 40;

// Shortens text to a word limit
// Adds "..." if text is cut off
const truncateByWords = (text, maxWords) => {
  // Handle null/undefined by returning empty string
  if (text == null) return "";
  
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
};
// Waiting until everything is defined to call PopulateCards()
document.addEventListener("DOMContentLoaded", () => {
  PopulateCards();
});

function getTodaystart(){
  const now = new Date();
  //This gets today at 0:00
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return startDay
}

async function fetchAPI() {
  if (devMode == false){
    try {
    const minDate = getTodaystart();
    const eventsreference = collection(db, "events");
    // sort out all the events that are earlier than todays date and make sure they are in ascending order
    const q = query(
      eventsreference,
      where("FIREBASETIME", ">=", minDate),
      orderBy("FIREBASETIME", "asc")
    );

    const querySnapshot = await getDocs(q);
  
    return querySnapshot.docs.map(doc => doc.data());

  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
  } else
  {
    const response = await loadAndTransformPuppetJson();
    console.log(response);
    return response;
  } 
}

/// template card generation
const card = document.getElementById("cardtemplate")
const cardgrid = document.getElementById("cardgrid")

// Store all events for filtering (full dataset)
// Filtering is applied in memory without refetching from network
let allEvents = [];

// Empty state message element (created once, reused)
let emptyStateElement = null;

/**
 * Creates a card element from an event object
 * Returns the card element or null if event should be skipped
 */
async function createCardFromEvent(event) {
  // instantiate clone
  const clone = card.content.cloneNode(true);

  // changing the names of elements
  clone.getElementById("eventname").textContent = event.EVENTNAME;
  clone.getElementById("location").textContent = `${event.CAMPUS} Campus, ${event.BUILDING} ${event.ROOM}`;
  clone.getElementById("description").textContent = event.DESCRIPTION;
  clone.getElementById("freefood").textContent = event.FREEFOOD;
  
  const start = makeDate(event.DATE, event.STARTTIME);
  const end = makeDate(event.DATE, event.ENDTIME);

  try {
    const status = await GetEventStatus(start, end, event.STARTTIME, event.ENDTIME);
    console.log(status)
    if (status.status === "past") {
      console.log("Skipping past event");
      return null; // Skip past events
    }
    await FormatEventStatus(clone, status)
  } catch (error) {
    console.log('Event status error', error.message);
  }

  return clone;
}

/**
 * Renders events to the card grid
 * @param {Array} eventsToRender - Array of event objects to render
 */
async function renderEvents(eventsToRender) {
  // Clear existing cards
  cardgrid.innerHTML = '';

  // Remove empty state if it exists
  if (emptyStateElement) {
    emptyStateElement.remove();
    emptyStateElement = null;
  }

  if (eventsToRender.length === 0) {
    // Show empty state message
    emptyStateElement = document.createElement('div');
    emptyStateElement.className = 'empty-state';
    emptyStateElement.textContent = 'No events found for this campus.';
    emptyStateElement.style.cssText = 'text-align: center; color: #8d979f; font-family: Inter, sans-serif; font-size: 16px; padding: 2rem; grid-column: 1 / -1;';
    cardgrid.appendChild(emptyStateElement);
    return;
  }

  // Render each event
  for (const event of eventsToRender) {
    const cardElement = await createCardFromEvent(event);
    if (cardElement) {
      cardgrid.appendChild(cardElement);
    }
  }
}

/**
 * Filters events by campus (case-insensitive)
 * @param {string} selectedCampus - Campus value to filter by, empty string shows all
 * @returns {Array} Filtered array of events
 */
function filterEventsByCampus(selectedCampus) {
  if (!selectedCampus || selectedCampus.trim() === '') {
    return allEvents; // Show all events
  }

  // Case-insensitive filtering
  return allEvents.filter(event => {
    const eventCampus = (event.CAMPUS || '').trim();
    return eventCampus.toLowerCase() === selectedCampus.toLowerCase();
  });
}

/**
 * Sets up campus filter event listener
 * To add a new campus option: add it to the select dropdown in index.html
 */
function setupCampusFilter() {
  const campusFilter = document.getElementById('campus-filter');
  if (!campusFilter) {
    console.warn('Campus filter select not found');
    return;
  }

  campusFilter.addEventListener('change', async (e) => {
    const selectedCampus = e.target.value;
    const filteredEvents = filterEventsByCampus(selectedCampus);
    await renderEvents(filteredEvents);
    // Blur the select to remove focus outline after selection
    e.target.blur();
  });
}

async function PopulateCards(){
    try{
       const data = await fetchAPI();
       //console.log('Processing the received data:', data);

       // Process all events and filter out past events
       // Store non-past events in allEvents for filtering
       allEvents = [];
       for (const event of data) {

        // instantiate clone
        const clone = card.content.cloneNode(true);

       // changing the names of elements
       
       clone.getElementById("location").textContent = `${event.CAMPUS} Campus, ${event.BUILDING} ${event.ROOM}`;
       clone.getElementById("freefood").textContent = event.FREEFOOD;
       // Save full text versions
       const fullTitle = event.EVENTNAME ?? "";
       const fullDesc = event.DESCRIPTION ?? "";

       // Show shortened text on the card
       clone.getElementById("eventname").textContent =
         truncateByWords(fullTitle, CARD_TITLE_MAX_WORDS);

       clone.getElementById("description").textContent =
         truncateByWords(fullDesc, CARD_DESC_MAX_WORDS);

       // Show full text when hovering
       clone.getElementById("eventname").title = fullTitle;
       clone.getElementById("description").title = fullDesc;
       const start = makeDate(event.DATE, event.STARTTIME);
        const end = makeDate(event.DATE, event.ENDTIME);

       try{
        const status = await GetEventStatus(start,end,event.STARTTIME,event.ENDTIME);
        console.log(status)
        if (status.status === "past") {
          console.log("Skipping past event");
          continue;
        }
        await FormatEventStatus(clone, status)
        // Add event to allEvents if not past
        allEvents.push(event);

       }catch(error){
        console.log('Event status error', error.message);
         const start = makeDate(event.DATE, event.STARTTIME);
         const end = makeDate(event.DATE, event.ENDTIME);
         try {
           const status = await GetEventStatus(start, end, event.STARTTIME, event.ENDTIME);
           if (status.status !== "past") {
             allEvents.push(event);
           }
         } catch (error) {
           // Include event if status check fails
           allEvents.push(event);
         }
       }
       } // Close for loop

       // Render all events initially (default: "All Campuses")
       await renderEvents(allEvents);

       // Set up campus filter
       setupCampusFilter();
    } catch (error) {
    console.log('Handling error in the main flow:', error.message);
    }
}

function GetEventStatus(start, end,strStart,strEnd) {
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
    // This is calculated in milliseconds
    const diffDays = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

    // Label event based on how far it is
    let label;
    //day is the formatted date
    let day;
    if (diffDays <= 7) {
      //would be formatted Saturday
      day = start.toLocaleDateString("en-US", { weekday: "long" });
    } else if (diffDays <= 30) {
      // would be formatted Dec 6th
      day = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      // would be formatted 2/6/2025
      day = start.toLocaleDateString();
    }

    return { status: "future", color: "red", blink:false,  label: `${day} from ${strStart} to ${strEnd}` };
}
 // Event is today:

  // Ended earlier TODAY
  if (nowTs > endTs) return { status: "past" };

  // Happening NOW and warning if event is closing in 30 minutes
  if (nowTs >= startTs && nowTs <= endTs) {
    const timeLeft = Math.ceil((endTs - nowTs)/(60 * 1000));
    const closingSoon = timeLeft <= 45;

    if (closingSoon) {
      return { status: "endingsoon", color: "green", blink:true, label: `Ending soon in ${timeLeft} minutes (today from ${strStart} to ${strEnd})`};
    }

    return { status: "now", color: "green", blink:false, label: `Happening now (today from ${strStart} to ${strEnd})` };
  }

  // Later TODAY
  if (nowTs < startTs) {
    const timetill = Math.ceil((startTs - nowTs)/(60 * 60 * 1000));
    const openingsoon = timetill <= 4;
    if (openingsoon){
      const openingwithinhour = timetill <=1;
      if (openingwithinhour){
        return { status: "upcoming", color: "orange", blink: true, label: `Starts in ${Math.ceil((startTs - nowTs)/(60 * 1000))} minutes (today from ${strStart} to ${strEnd})` };
      }
      return { status: "upcoming", color: "orange", blink: true, label: `Starts in ${timetill} hours (today from ${strStart} to ${strEnd})` };
    }
    return { status: "upcoming", color: "orange", blink:false, label: `Starts in ${timetill} hours (today from ${strStart} to ${strEnd})` };
  }

  return { status: "unknown" };
}

function FormatEventStatus(clone, status){

  const red = "#dd3c18";
  const green = "#19b875";
  const orange = "#f6cc5d";

  // Map status.color to actual hex value
  let color;
  switch (status.color) {
    case "red":
      color = red;
      break;
    case "green":
      color = green;
      break;
    case "orange":
      color = orange;
      break;
    default:
      color = red; // fallback
  }

  clone.getElementById("header").textContent = status.label;
  clone.getElementById("avatar").style.setProperty("--eventstatuscolor", color);
  clone.getElementById("header").style.setProperty("--eventstatuscolor", color);
  clone.getElementById("header-container").style.setProperty("--eventstatuscolor", color);

  if (status.blink == true){
    clone.getElementById("avatar").classList.add("blink");
  }
}

