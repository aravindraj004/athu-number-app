from flask import Flask, render_template_string

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
      width: min(560px, 100%);
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
  </style>
</head>
<body>
  <main class="card">
    <h1>Athu's Number APP</h1>
    <p class="hint">Click Generate. Listen to the number (0 to 500), then type what you heard.</p>

    <div class="row">
      <button id="generateBtn" type="button">Generate Number</button>
      <button id="repeatBtn" type="button">Repeat Audio</button>
    </div>

    <div class="row">
      <input id="answerInput" type="number" min="0" max="500" placeholder="Enter number here" />
      <button id="checkBtn" type="button">Check Answer</button>
      <button id="nextBtn" type="button" style="display:none;">Next Number</button>
    </div>

    <div id="message" class="msg"></div>
  </main>

  <script>
    let currentNumber = null;
    let roundFinished = false;
    let preferredVoice = null;
    const messageEl = document.getElementById("message");
    const inputEl = document.getElementById("answerInput");
    const nextBtn = document.getElementById("nextBtn");

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
      const maleHints = ["male", "man", "ravi", "david", "mark", "alex"];

      const prioritizedFemaleIndianNames = ["heera", "aditi", "veena", "lekha", "priya"];

      const byNamePriority = voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return (lang === "en-in" || lang.startsWith("hi-in")) &&
          prioritizedFemaleIndianNames.some((n) => name.includes(n));
      });
      if (byNamePriority) return byNamePriority;

      const exactIndianFemale = voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return (lang === "en-in" || lang.startsWith("hi-in")) && femaleHints.some((h) => name.includes(h));
      });
      if (exactIndianFemale) return exactIndianFemale;

      const femaleEnglish = voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return lang.startsWith("en") && femaleHints.some((h) => name.includes(h));
      });
      if (femaleEnglish) return femaleEnglish;

      const indianVoice = voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        const isIndian = lang === "en-in" || lang.startsWith("hi-in") || name.includes("india") || name.includes("hindi");
        const looksMale = maleHints.some((h) => name.includes(h));
        return isIndian && !looksMale;
      });
      if (indianVoice) return indianVoice;

      return voices.find((v) => v.lang.toLowerCase().startsWith("en")) || voices[0];
    }

    function speak(text) {
      window.speechSynthesis.cancel();
      if (!preferredVoice) preferredVoice = pickPreferredVoice();
      const utter = new SpeechSynthesisUtterance(text);
      if (preferredVoice) utter.voice = preferredVoice;
      utter.lang = preferredVoice ? preferredVoice.lang : "en-IN";
      utter.rate = 0.7;
      utter.pitch = 1.0;
      if (preferredVoice) {
        console.log("Using voice:", preferredVoice.name, preferredVoice.lang);
      }
      window.speechSynthesis.speak(utter);
    }

    window.speechSynthesis.onvoiceschanged = () => {
      preferredVoice = pickPreferredVoice();
    };

    function nextRound() {
      currentNumber = Math.floor(Math.random() * 501);
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
      if (!Number.isInteger(answer) || answer < 0 || answer > 500) {
        messageEl.textContent = "Enter a whole number from 0 to 500.";
        return;
      }

      if (answer === currentNumber) {
        messageEl.textContent = "Correct! Great job. Click Next Number.";
        messageEl.className = "msg ok";
        speak("Correct. Great job.");
      } else {
        messageEl.textContent = `Not quite. The correct number was ${currentNumber}. Click Next Number.`;
        messageEl.className = "msg bad";
        speak(`Not quite. The correct number was ${currentNumber}.`);
      }
      roundFinished = true;
      nextBtn.style.display = "inline-block";
    }

    document.getElementById("checkBtn").addEventListener("click", checkAnswer);
    nextBtn.addEventListener("click", nextRound);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkAnswer();
    });
  </script>
</body>
</html>
"""


@app.route("/")
def home() -> str:
    return render_template_string(HTML)


if __name__ == "__main__":
    app.run(debug=True)
