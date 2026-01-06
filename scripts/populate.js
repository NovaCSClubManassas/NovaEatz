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
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
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

async function PopulateCards(){
    try{
       const data = await fetchAPI();
       //console.log('Processing the received data:', data);

       /// loop through each json entry
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

       }catch(error){
        console.log('Event status error', error.message);
       }
      
       // Add clone to html
       cardgrid.appendChild(clone);
       };
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

