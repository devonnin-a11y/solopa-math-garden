// Global sound state
let soundOn = true;

// Simple helper: speak text using TTS
function speak(text, opts = {}) {
  if (!soundOn) return;
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = opts.pitch ?? 1.1; // slightly kid-like
  utterance.rate = opts.rate ?? 0.95;  // gentle pace

  // Try to choose a younger / friendly voice if available
  const voices = speechSynthesis.getVoices();
  if (voices && voices.length) {
    const childLike = voices.find(v =>
      /child|kids|girl|boy|junior/i.test(v.name)
    );
    utterance.voice = childLike || voices[0];
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// Re-load voices on some browsers
window.speechSynthesis && window.speechSynthesis.onvoiceschanged && (window.speechSynthesis.onvoiceschanged = () => {});

// Scroll to a given world
function scrollToWorld(worldKey) {
  const worldsContainer = document.getElementById("worlds");
  const target = document.querySelector(`.world[data-world="${worldKey}"]`);
  if (!worldsContainer || !target) return;

  target.scrollIntoView({ behavior: "smooth", inline: "start" });

  // Update tabs active state
  document.querySelectorAll(".world-tab").forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.worldTarget === worldKey
    );
  });
}

// Setup navigation handlers
function setupNavigation() {
  // Tab buttons
  document.querySelectorAll(".world-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.worldTarget;
      scrollToWorld(target);
      speak(tab.textContent.trim());
    });
  });

  // Home cards
  document.querySelectorAll(".world-card").forEach(card => {
    card.addEventListener("click", () => {
      const target = card.dataset.worldTarget;
      scrollToWorld(target);
      speak(card.querySelector(".world-card-title").textContent.trim());
    });
  });

  // Sound toggle
  const soundToggle = document.getElementById("soundToggle");
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.textContent = soundOn ? "🔊" : "🔈";
    soundToggle.setAttribute("aria-pressed", soundOn ? "true" : "false");
    if (soundOn) speak("Sound on!");
  });
}

// Numbers world logic
function setupNumbersWorld() {
  const spriteText = document.getElementById("numbersSpriteText");
  const starsRow = document.getElementById("starsRow");

  document.querySelectorAll(".num-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const value = parseInt(btn.dataset.number, 10);
      if (Number.isNaN(value)) return;

      // Speak number
      speak(String(value));

      // Update sprite text
      if (spriteText) {
        spriteText.textContent = `That is ${value}!`;
      }

      // Show stars
      if (starsRow) {
        starsRow.innerHTML = "";
        for (let i = 0; i < value; i++) {
          const span = document.createElement("span");
          span.textContent = "⭐";
          starsRow.appendChild(span);
        }
      }

      // Tiny button bounce
      btn.classList.add("pressed");
      setTimeout(() => btn.classList.remove("pressed"), 150);
    });
  });
}

// Counting world logic
function setupCountingWorld() {
  const appleArea = document.getElementById("appleArea");
  const countValue = document.getElementById("countValue");
  const spriteText = document.getElementById("countingSpriteText");
  const btnDown = document.getElementById("countDown");
  const btnUp = document.getElementById("countUp");
  const btnSpeak = document.getElementById("countSpeak");

  let current = 3;
  const min = 0;
  const max = 10;

  function renderApples() {
    if (!appleArea) return;
    appleArea.innerHTML = "";
    for (let i = 0; i < current; i++) {
      const span = document.createElement("span");
      span.textContent = "🍎";
      appleArea.appendChild(span);
    }
    if (countValue) countValue.textContent = current;
    if (spriteText) {
      spriteText.textContent =
        current === 0
          ? "No apples! Let's add some."
          : `I see ${current} apple${current === 1 ? "" : "s"}!`;
    }
  }

  btnDown.addEventListener("click", () => {
    current = Math.max(min, current - 1);
    renderApples();
  });

  btnUp.addEventListener("click", () => {
    current = Math.min(max, current + 1);
    renderApples();
  });

  btnSpeak.addEventListener("click", () => {
    const phrase =
      current === 0
        ? "There are zero apples."
        : `There are ${current} apple${current === 1 ? "" : "s"}.`;
    speak(phrase);
  });

  renderApples();
}

// Read & Count logic
function setupReadCountWorld() {
  const sentenceEl = document.getElementById("readSentence");
  const spriteText = document.getElementById("readSpriteText");
  const playButton = document.getElementById("readPlay");

  if (!sentenceEl || !playButton) return;

  const wordEls = Array.from(sentenceEl.querySelectorAll("span"));
  const fullSentence = wordEls.map(span => span.textContent).join(" ");

  function clearHighlights() {
    wordEls.forEach(w => w.classList.remove("highlighted"));
  }

  playButton.addEventListener("click", () => {
    clearHighlights();
    speak(fullSentence, { rate: 0.9 });

    // highlight words in sequence
    const delayPerWord = 500;
    wordEls.forEach((span, index) => {
      setTimeout(() => {
        clearHighlights();
        span.classList.add("highlighted");
      }, delayPerWord * index);
    });
    setTimeout(clearHighlights, delayPerWord * wordEls.length + 200);

    if (spriteText) {
      spriteText.textContent = "Nice reading!";
    }
  });
}

// Simple service worker registration for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .catch(err => console.log("SW registration failed", err));
  });
}

// Init
window.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupNumbersWorld();
  setupCountingWorld();
  setupReadCountWorld();
});
