import os
from flask import Flask, render_template_string, send_from_directory

app = Flask(__name__)


HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Athu's Number APP</title>
  <style>
    :root {
      --bg1: #fff7ed;
      --bg2: #e0f2fe;
      --card: #ffffff;
      --text: #1f2937;
      --ok: #166534;
      --bad: #b91c1c;
      --accent: #0f766e;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: "Trebuchet MS", "Comic Sans MS", sans-serif;
      color: var(--text);
      background: linear-gradient(135deg, var(--bg1), var(--bg2));
      padding: 20px;
    }
    .card {
      width: min(920px, 100%);
      background: var(--card);
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      padding: 24px;
    }
    h1 { margin-top: 0; }
    .row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    button, input {
      font-size: 1rem;
      border-radius: 10px;
      border: 1px solid #d1d5db;
      padding: 10px 14px;
    }
    button {
      border: none;
      background: var(--accent);
      color: #fff;
      cursor: pointer;
    }
    button:hover { filter: brightness(1.05); }
    input {
      width: 220px;
      max-width: 100%;
    }
    .msg {
      min-height: 26px;
      font-size: 1.05rem;
      font-weight: 700;
    }
    .ok { color: var(--ok); }
    .bad { color: var(--bad); }
    .hint {
      font-size: 0.95rem;
      opacity: 0.85;
    }
    .panes {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 18px;
      align-items: start;
    }
    .right-pane {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px;
      background: #f9fafb;
    }
    .score-title {
      margin: 0 0 6px 0;
      font-size: 1rem;
    }
    .score-value {
      margin: 0 0 10px 0;
      font-size: 2rem;
      font-weight: 800;
      color: var(--accent);
    }
    .image-wrap {
      width: 100%;
      min-height: 180px;
      border: 1px dashed #d1d5db;
      border-radius: 12px;
      display: grid;
      place-items: center;
      overflow: hidden;
      background: #fff;
      margin-top: 10px;
    }
    .result-image {
      width: 100%;
      max-height: 220px;
      object-fit: contain;
      display: none;
    }
    .image-placeholder {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.75;
      text-align: center;
      padding: 8px;
    }
    @media (max-width: 760px) {
      .panes {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="panes">
      <section>
    <h1>Athu's Number APP</h1>
        <p class="hint">Set range, click Generate, listen to the number, then type what you heard.</p>

        <div class="row">
          <button id="generateBtn" type="button">Generate Number</button>
          <button id="repeatBtn" type="button">Repeat Audio</button>
        </div>

        <div class="row">
          <label for="startInput">Start:</label>
          <input id="startInput" type="number" min="0" step="1" value="0" style="width:120px;" />
          <label for="endInput">End:</label>
          <input id="endInput" type="number" min="0" step="1" value="500" style="width:120px;" />
        </div>

        <div class="row">
          <label for="voiceSelect">Voice:</label>
          <select id="voiceSelect" style="min-width: 260px; max-width: 100%;"></select>
          <button id="refreshVoicesBtn" type="button">Refresh Voices</button>
        </div>

        <div class="row">
          <input id="answerInput" type="number" min="0" max="500" placeholder="Enter number here" />
          <button id="checkBtn" type="button">Check Answer</button>
          <button id="nextBtn" type="button" style="display:none;">Next Number</button>
        </div>

        <div id="message" class="msg"></div>
      </section>

      <aside class="right-pane">
        <h2 class="score-title">Pointer</h2>
        <p id="scoreValue" class="score-value">0</p>
        <div class="image-wrap">
          <img id="resultImage" class="result-image" alt="Answer result image" />
          <p id="imagePlaceholder" class="image-placeholder">Answer to see correct/wrong image.</p>
        </div>
      </aside>
    </div>
  </main>

  <script>
    let currentNumber = null;
    let roundFinished = false;
    let points = 0;
    let generationCount = 0;
    let activeRangeStart = 0;
    let activeRangeEnd = 500;
    let preferredVoice = null;
    let cachedVoices = [];
    const messageEl = document.getElementById("message");
    const inputEl = document.getElementById("answerInput");
    const startInputEl = document.getElementById("startInput");
    const endInputEl = document.getElementById("endInput");
    const nextBtn = document.getElementById("nextBtn");
    const voiceSelectEl = document.getElementById("voiceSelect");
    const scoreValueEl = document.getElementById("scoreValue");
    const resultImageEl = document.getElementById("resultImage");
    const imagePlaceholderEl = document.getElementById("imagePlaceholder");

    function updatePointsDisplay() {
      scoreValueEl.textContent = String(points);
    }

    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function applyAnswerInputRange(min, max) {
      inputEl.min = String(min);
      inputEl.max = String(max);
      inputEl.placeholder = `Enter number (${min} to ${max})`;
    }

    function getValidatedRange() {
      const startRaw = startInputEl.value.trim();
      const endRaw = endInputEl.value.trim();
      if (startRaw === "" || endRaw === "") {
        messageEl.textContent = "Please enter both start and end range values.";
        return null;
      }
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < 0) {
        messageEl.textContent = "Range must be whole numbers 0 or greater.";
        return null;
      }
      if (start > end) {
        messageEl.textContent = "Start range must be less than or equal to end range.";
        return null;
      }
      return { start, end };
    }

    function generateSpecialNumber(min, max) {
      const intervals = [];
      const fromHundreds = Math.floor(min / 100);
      const toHundreds = Math.floor(max / 100);

      for (let h = fromHundreds; h <= toHundreds; h += 1) {
        const bucketStart = h * 100;
        const low = Math.max(min, bucketStart);
        const high = Math.min(max, bucketStart + 19);
        if (low <= high) intervals.push([low, high]);
      }

      if (!intervals.length) return null;

      let total = 0;
      intervals.forEach(([low, high]) => {
        total += (high - low + 1);
      });

      let pick = randomInt(1, total);
      for (const [low, high] of intervals) {
        const size = high - low + 1;
        if (pick <= size) return low + pick - 1;
        pick -= size;
      }
      return intervals[0][0];
    }

    function showResultImage(isCorrect) {
      resultImageEl.src = isCorrect ? "/correct.jpeg" : "/Wrong.jpeg";
      resultImageEl.style.display = "block";
      imagePlaceholderEl.style.display = "none";
    }

    function pickPreferredVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return null;

      const femaleHints = [
        "female",
        "woman",
        "heera",
        "aditi",
        "veena",
        "lekha",
        "priya",
        "samantha",
        "zira",
        "hazel"
      ];
      const prioritizedFemaleIndianNames = ["heera", "aditi", "veena", "lekha", "priya"];

      const byNamePriority = voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return lang === "en-in" &&
          prioritizedFemaleIndianNames.some((n) => name.includes(n));
      });
      if (byNamePriority) return byNamePriority;

      const exactIndianFemale = voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return lang === "en-in" && femaleHints.some((h) => name.includes(h));
      });
      if (exactIndianFemale) return exactIndianFemale;

      const anyIndianEnglish = voices.find((v) => v.lang.toLowerCase() === "en-in");
      if (anyIndianEnglish) return anyIndianEnglish;

      const femaleEnglish = voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return lang.startsWith("en") && femaleHints.some((h) => name.includes(h));
      });
      if (femaleEnglish) return femaleEnglish;

      return voices.find((v) => v.lang.toLowerCase().startsWith("en")) || voices[0];
    }

    function populateVoiceSelect() {
      const voices = window.speechSynthesis.getVoices();
      cachedVoices = voices;
      voiceSelectEl.innerHTML = "";

      if (!voices.length) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "No voices found yet";
        voiceSelectEl.appendChild(opt);
        return;
      }

      const recommended = pickPreferredVoice();
      voices.forEach((voice, idx) => {
        const opt = document.createElement("option");
        opt.value = String(idx);
        opt.textContent = `${voice.name} (${voice.lang})`;
        if (recommended && voice.name === recommended.name && voice.lang === recommended.lang) {
          opt.selected = true;
        }
        voiceSelectEl.appendChild(opt);
      });
    }

    function getSelectedVoice() {
      const idx = Number(voiceSelectEl.value);
      if (Number.isInteger(idx) && cachedVoices[idx]) return cachedVoices[idx];
      return pickPreferredVoice();
    }

    function speak(text) {
      window.speechSynthesis.cancel();
      preferredVoice = getSelectedVoice();
      const utter = new SpeechSynthesisUtterance(text);
      if (preferredVoice) utter.voice = preferredVoice;
      utter.lang = "en-IN";
      utter.rate = 0.7;
      utter.pitch = 1.0;
      if (preferredVoice) {
        console.log("Using voice:", preferredVoice.name, preferredVoice.lang);
      }
      window.speechSynthesis.speak(utter);
    }

    window.speechSynthesis.onvoiceschanged = () => {
      populateVoiceSelect();
    };
    document.getElementById("refreshVoicesBtn").addEventListener("click", populateVoiceSelect);
    populateVoiceSelect();

    function nextRound() {
      const range = getValidatedRange();
      if (!range) return;

      activeRangeStart = range.start;
      activeRangeEnd = range.end;
      applyAnswerInputRange(activeRangeStart, activeRangeEnd);

      generationCount += 1;
      if (generationCount % 3 === 0) {
        const special = generateSpecialNumber(activeRangeStart, activeRangeEnd);
        currentNumber = special === null
          ? randomInt(activeRangeStart, activeRangeEnd)
          : special;
      } else {
        currentNumber = randomInt(activeRangeStart, activeRangeEnd);
      }
      roundFinished = false;
      messageEl.textContent = "";
      messageEl.className = "msg";
      inputEl.value = "";
      nextBtn.style.display = "none";
      inputEl.focus();
      speak(String(currentNumber));
    }

    document.getElementById("generateBtn").addEventListener("click", nextRound);

    document.getElementById("repeatBtn").addEventListener("click", () => {
      if (currentNumber === null) {
        messageEl.textContent = "Click Generate Number first.";
        return;
      }
      speak(String(currentNumber));
    });

    function checkAnswer() {
      if (currentNumber === null) {
        messageEl.textContent = "Click Generate Number first.";
        return;
      }
      if (roundFinished) {
        messageEl.textContent = "Click Next Number to continue.";
        return;
      }
      const value = inputEl.value.trim();
      if (value === "") {
        messageEl.textContent = "Please enter a number.";
        return;
      }
      const answer = Number(value);
      if (!Number.isInteger(answer) || answer < activeRangeStart || answer > activeRangeEnd) {
        messageEl.textContent = `Enter a whole number from ${activeRangeStart} to ${activeRangeEnd}.`;
        return;
      }

      if (answer === currentNumber) {
        points += 1;
        updatePointsDisplay();
        showResultImage(true);
        messageEl.textContent = "Correct! Great job. Click Next Number.";
        messageEl.className = "msg ok";
        speak(`Correct. Great job. Latest points: ${points}.`);
      } else {
        points = 0;
        updatePointsDisplay();
        showResultImage(false);
        messageEl.textContent = `Not quite. The correct number was ${currentNumber}. Click Next Number.`;
        messageEl.className = "msg bad";
        speak(`Not quite. The correct number was ${currentNumber}. Latest points: ${points}.`);
      }
      roundFinished = true;
      nextBtn.style.display = "inline-block";
    }

    document.getElementById("checkBtn").addEventListener("click", checkAnswer);
    nextBtn.addEventListener("click", nextRound);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkAnswer();
    });
    applyAnswerInputRange(activeRangeStart, activeRangeEnd);
    updatePointsDisplay();
  </script>
</body>
</html>
"""


@app.route("/")
def home() -> str:
    return render_template_string(HTML)


@app.route("/correct.jpeg")
def correct_image():
    return send_from_directory(app.root_path, "correct.jpeg")


@app.route("/Wrong.jpeg")
def wrong_image():
    return send_from_directory(app.root_path, "Wrong.jpeg")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
