let message = "🍔🌭🍟NovaEatz🍔🌭🍟";
document.addEventListener("DOMContentLoaded", () => {
  greetingtagupdate();
});

// Split into graphemes so emojis don't break
const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
const chars = [...seg.segment(message)].map(s => s.segment);

let pos = 0;

setInterval(() => {
  if (document.hidden) {
    document.title = "😢 Nooo, come back... 😭";
  } else {
    const rotated =
      chars.slice(pos).join("") + chars.slice(0, pos).join("");
    document.title = rotated;
    pos = (pos + 1) % chars.length;
  }
}, 300);

function getRandomItem(arr) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    const item = arr[randomIndex];
    return item;
}

emojis = ["🍔","🌭","🍟"]

const greetingtag = 
  ["Hungry? We've got you covered!",
   "Did someone said FREE FOOD?!?!", 
   "Somewhere on campus… free food is calling your name",
    "Fuel up, scholar!", 
    "You’re doing great. Have a snack!",
    "Warning: deliciousness detected nearby!"]

function greetingtagupdate(){
  randomtag = getRandomItem(greetingtag);
  if (document.getElementById("greetingtag")){
    document.getElementById("greetingtag").textContent = randomtag;
    console.log(randomtag);
  }
}

document.addEventListener('click', e => {
    const heart = document.createElement('div');
    heart.textContent = getRandomItem(emojis);
    heart.className = 'ClickBurger noselect';
    heart.style.left = e.pageX + 'px';
    heart.style.top = e.pageY + 'px';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
  });

