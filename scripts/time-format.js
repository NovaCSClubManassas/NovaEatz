
// Takes the event data and event time and turns it into a JavaScript Date 
export function makeDate(dateStr, timeStr) {
  //InputOutput:
  //console.log ("makeDate" + " Input date: " + dateStr + " Input time: " + timeStr + " Output: " + new Date(`${dateStr}T${to24Hour(timeStr)}`))
  
  return new Date(`${dateStr}T${to24Hour(timeStr)}`);
}

// Converts time to 24 hours
export function to24Hour(timeStr) {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");

  hours = parseInt(hours, 10);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  // InputOutput: 
  // console.log("to24Hour" + " Input:" + timeStr + " Output: " + `${String(hours).padStart(2, "0")}:${minutes}`)

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}
