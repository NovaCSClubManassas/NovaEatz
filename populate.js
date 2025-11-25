/// initial calls
// Call the function to make the API request
PopulateCards()

async function fetchAPI() {
  try {
    const response = await fetch('puppet.json'); // Replace with your backend URL/endpoint

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const dbresponse = await response.json();
    //console.log('Data from backend:', dbresponse)
    return dbresponse;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
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
       clone.getElementById("eventname").textContent = event.EVENTNAME;
       clone.getElementById("location").textContent = `${event.CAMPUS} Campus, ${event.BUILDING} ${event.ROOM}`;
       clone.getElementById("description").textContent = event.DESCRIPTION;
       clone.getElementById("freefood").textContent = event.FREEFOOD;
       
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
    const timeLeft = (endTs - nowTs)/(60 * 1000);
    const closingSoon = timeLeft <= 45;

    if (closingSoon) {
      return { status: "endingsoon", time: timeLeft, color: "green", blink:true, label: "Ending soon in", blink: true };
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


// Takes the event data and event time and turns it into a JavaScript Date 
function makeDate(dateStr, timeStr) {
  //InputOutput:
  //console.log ("makeDate" + " Input date: " + dateStr + " Input time: " + timeStr + " Output: " + new Date(`${dateStr}T${to24Hour(timeStr)}`))
  
  return new Date(`${dateStr}T${to24Hour(timeStr)}`);
}

// Converts time to 24 hours
function to24Hour(timeStr) {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");

  hours = parseInt(hours, 10);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  // InputOutput: 
  // console.log("to24Hour" + " Input:" + timeStr + " Output: " + `${String(hours).padStart(2, "0")}:${minutes}`)

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

