import os
from flask import Flask, redirect, render_template_string, send_from_directory

app = Flask(__name__)

LANDING_HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Athu Maths Practice</title>
  <style>
    :root{color-scheme:light;--ink:#18212f;--muted:#5c6675;--line:#d9e0ea;--green:#0f766e;--blue:#2563eb;--rose:#be123c;--paper:#fff}
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:grid;place-items:center;padding:22px;font-family:"Trebuchet MS",Arial,sans-serif;background:linear-gradient(135deg,#fff7ed,#dcfce7 48%,#e0f2fe);color:var(--ink)}
    .wrap{width:min(980px,100%);display:grid;grid-template-columns:.9fr 1.1fr;gap:18px;align-items:stretch}
    .intro,.choices{background:rgba(255,255,255,.94);border:1px solid rgba(24,33,47,.08);border-radius:18px;padding:26px;box-shadow:0 18px 45px rgba(24,33,47,.1)}
    .tag{display:inline-flex;align-items:center;padding:7px 11px;border-radius:999px;background:#e6fffa;color:#115e59;font-size:.82rem;font-weight:800;text-transform:uppercase}
    h1{font-size:clamp(2.2rem,5vw,4.6rem);line-height:.96;margin:20px 0 14px;max-width:9ch}
    p{color:var(--muted);font-size:1.05rem;line-height:1.55}
    .choices{display:grid;gap:12px}
    .choice{display:grid;grid-template-columns:54px 1fr;gap:14px;align-items:center;text-decoration:none;color:inherit;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--paper)}
    .choice:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(24,33,47,.1)}
    .icon{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:1.35rem;font-weight:900}
    .numbers{background:var(--green)}.add{background:var(--blue)}.subtract{background:var(--rose)}
    h2{margin:0 0 5px;font-size:1.35rem}.choice p{margin:0;font-size:.98rem}
    @media (max-width:760px){body{place-items:start}.wrap{grid-template-columns:1fr}.intro,.choices{padding:20px}h1{max-width:12ch}}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="intro">
      <div class="tag">Maths Practice</div>
      <h1>Choose today's challenge.</h1>
      <p>Practice listening to numbers, solving addition, or solving subtraction. Each activity keeps score as you work.</p>
    </section>
    <section class="choices" aria-label="Maths activities">
      <a class="choice" href="/numbers"><span class="icon numbers">123</span><span><h2>Numbers</h2><p>Hear a number and type what you heard.</p></span></a>
      <a class="choice" href="/addition"><span class="icon add">+</span><span><h2>Addition</h2><p>Questions cycle through 2 digit, 3 digit, and mixed digit sums.</p></span></a>
      <a class="choice" href="/subtraction"><span class="icon subtract">-</span><span><h2>Subtraction</h2><p>Questions cycle through 2 digit, 3 digit, and mixed digit subtraction.</p></span></a>
    </section>
  </main>
</body>
</html>
"""

MATHS_HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{ title }}</title>
  <style>
    :root{color-scheme:light;--ink:#1f2937;--muted:#5b6472;--line:#d1d5db;--green:#0f766e;--blue:#2563eb;--rose:#be123c;--soft:#f8fafc}
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;font-family:"Trebuchet MS",Arial,sans-serif;background:linear-gradient(135deg,#fff7ed,#ecfccb 48%,#e0f2fe);color:var(--ink)}
    .card{width:min(980px,100%);background:#fff;border-radius:18px;padding:24px;box-shadow:0 18px 45px rgba(0,0,0,.1)}
    .top,.row{display:flex;gap:10px;flex-wrap:wrap}.top{justify-content:space-between;align-items:center}
    .panes{display:grid;grid-template-columns:1fr 250px;gap:18px;align-items:start}
    .side{background:var(--soft);border:1px solid #e5e7eb;border-radius:14px;padding:15px}
    input,select,button{font-size:1rem;border-radius:12px;padding:10px 14px}
    input,select{border:1px solid var(--line);max-width:100%}
    button{border:none;background:var(--green);color:#fff;cursor:pointer;font-weight:800}
    button:hover{filter:brightness(.96)}.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}
    a{text-decoration:none;color:#6d2e62;font-weight:800}.muted{color:var(--muted)}
    .question{min-height:74px;font-size:clamp(2.1rem,6vw,4.4rem);font-weight:900;letter-spacing:0;margin:12px 0;color:{{ accent }}}
    .msg{min-height:28px;font-weight:800}.ok{color:#166534}.bad{color:#b91c1c}
    .result-photo{display:none;width:min(260px,100%);height:auto;margin-top:12px;border-radius:14px;border:1px solid #e5e7eb}
    .pill{display:inline-flex;align-items:center;border-radius:999px;padding:7px 11px;background:#eef2ff;color:#3730a3;font-weight:800}
    .score{font-size:2.3rem;font-weight:900;color:var(--green);margin:0}
    .operation-only{display:{{ operation_display }}}.number-only,.audio-only{display:{{ number_display }}}
    @media (max-width:760px){.panes{grid-template-columns:1fr}.card{padding:18px}.row>*{flex:1 1 auto}.question{min-height:60px}}
  </style>
</head>
<body>
  <main class="card">
    <div class="top">
      <div>
        <span class="pill">{{ badge }}</span>
        <h1>{{ title }}</h1>
      </div>
      <a href="/">Back to Home</a>
    </div>
    <p class="muted">{{ intro }}</p>
    <div class="panes">
      <section>
        <div class="question" id="questionText">Ready?</div>
        {% if mode == "numbers" %}
        <div class="row">
          <button id="generateBtn" type="button">{{ start_label }}</button>
          <button id="repeatBtn" class="audio-only" type="button">Repeat Audio</button>
        </div>
        {% endif %}
        {% if mode == "numbers" %}
        <div class="row number-only">
          <label for="startInput">Start:</label>
          <input id="startInput" type="number" min="0" step="1" value="0" style="width:120px;" />
          <label for="endInput">End:</label>
          <input id="endInput" type="number" min="0" step="1" value="500" style="width:120px;" />
        </div>
        <div class="row audio-only">
          <label for="voiceSelect">Voice:</label>
          <select id="voiceSelect" style="min-width:260px;"></select>
          <button id="refreshVoicesBtn" class="ghost" type="button">Refresh Voices</button>
        </div>
        {% endif %}
        <div class="row">
          <input id="answerInput" type="number" min="0" placeholder="{{ answer_placeholder }}" />
          <button id="checkBtn" type="button">Check Answer</button>
          <button id="nextBtn" type="button" style="display:none;">Next Question</button>
        </div>
        <div id="message" class="msg"></div>
        <img id="resultPhoto" class="result-photo" alt="" />
      </section>
      <aside class="side">
        <h2>Points</h2>
        <p id="scoreValue" class="score">0</p>
        <div class="operation-only">
          <h2>Round Robin</h2>
          <p id="patternText" class="muted">2 digit and 2 digit</p>
        </div>
      </aside>
    </div>
  </main>
  <script>
    const MODE = "{{ mode }}";
    const OPERATION = "{{ operation }}";
    const PATTERNS = [
      { label: "2 digit and 2 digit", minA: 10, maxA: 99, minB: 10, maxB: 99 },
      { label: "3 digit and 3 digit", minA: 100, maxA: 999, minB: 100, maxB: 999 },
      { label: "3 digit and 2 digit", minA: 100, maxA: 999, minB: 10, maxB: 99 }
    ];
    let currentAnswer = null, spokenText = "", roundFinished = false, points = 0, activeRangeStart = 0, activeRangeEnd = 500, cachedVoices = [], patternIndex = 0;
    const messageEl = document.getElementById("message");
    const inputEl = document.getElementById("answerInput");
    const startInputEl = document.getElementById("startInput");
    const endInputEl = document.getElementById("endInput");
    const nextBtn = document.getElementById("nextBtn");
    const voiceSelectEl = document.getElementById("voiceSelect");
    const scoreValueEl = document.getElementById("scoreValue");
    const questionTextEl = document.getElementById("questionText");
    const patternTextEl = document.getElementById("patternText");
    const resultPhotoEl = document.getElementById("resultPhoto");
    function updatePointsDisplay(){scoreValueEl.textContent=String(points)}
    function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}
    function applyAnswerInputRange(min,max){inputEl.min=String(min);inputEl.max=String(max);inputEl.placeholder=`Enter answer (${min} to ${max})`}
    function getValidatedRange(){
      if(!startInputEl || !endInputEl)return {start:activeRangeStart,end:activeRangeEnd};
      const start=Number(startInputEl.value.trim()), end=Number(endInputEl.value.trim());
      if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<0){messageEl.textContent="Range must be whole numbers 0 or greater.";return null}
      if(start>end){messageEl.textContent="Start range must be less than or equal to end range.";return null}
      return {start,end}
    }
    function pickPreferredVoice(){const voices=window.speechSynthesis.getVoices();return voices.find((v)=>v.lang.toLowerCase().startsWith("en"))||voices[0]||null}
    function populateVoiceSelect(){
      if(!voiceSelectEl)return;
      const voices=window.speechSynthesis.getVoices(); cachedVoices=voices; voiceSelectEl.innerHTML="";
      if(!voices.length){const opt=document.createElement("option");opt.value="";opt.textContent="No voices found yet";voiceSelectEl.appendChild(opt);return}
      const preferred=pickPreferredVoice();
      voices.forEach((voice,idx)=>{const opt=document.createElement("option");opt.value=String(idx);opt.textContent=`${voice.name} (${voice.lang})`;if(preferred&&voice.name===preferred.name&&voice.lang===preferred.lang)opt.selected=true;voiceSelectEl.appendChild(opt)})
    }
    function getSelectedVoice(){if(!voiceSelectEl)return pickPreferredVoice();const idx=Number(voiceSelectEl.value);return Number.isInteger(idx)&&cachedVoices[idx]?cachedVoices[idx]:pickPreferredVoice()}
    function speak(text){window.speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);const voice=getSelectedVoice();if(voice)utter.voice=voice;utter.lang="en-IN";utter.rate=0.72;utter.pitch=1;window.speechSynthesis.speak(utter)}
    function newNumberRound(){
      const range=getValidatedRange(); if(!range)return;
      activeRangeStart=range.start; activeRangeEnd=range.end; applyAnswerInputRange(activeRangeStart,activeRangeEnd);
      currentAnswer=randomInt(activeRangeStart,activeRangeEnd); spokenText=String(currentAnswer); questionTextEl.textContent="Listen and type"; resetRound(); speak(spokenText);
    }
    function newOperationRound(){
      const pattern=PATTERNS[patternIndex % PATTERNS.length]; patternIndex += 1;
      let a=randomInt(pattern.minA,pattern.maxA), b=randomInt(pattern.minB,pattern.maxB);
      if(MODE==="subtraction" && b>a){const temp=a; a=b; b=temp}
      currentAnswer = MODE==="addition" ? a + b : a - b;
      spokenText = "";
      questionTextEl.textContent = `${a} ${OPERATION} ${b} =`;
      patternTextEl.textContent = pattern.label;
      applyAnswerInputRange(0, MODE==="addition" ? 1998 : 989);
      resetRound();
    }
    function resetRound(){roundFinished=false;messageEl.textContent="";messageEl.className="msg";inputEl.value="";nextBtn.style.display="none";resultPhotoEl.style.display="none";resultPhotoEl.removeAttribute("src");inputEl.focus()}
    function nextRound(){if(MODE==="numbers")newNumberRound();else newOperationRound()}
    function checkAnswer(){
      if(currentAnswer===null){messageEl.textContent="Click the start button first.";return}
      if(roundFinished){messageEl.textContent="Click Next Question to continue.";return}
      const value=inputEl.value.trim(); if(value===""){messageEl.textContent="Please enter an answer.";return}
      const answer=Number(value);
      if(!Number.isInteger(answer)){messageEl.textContent="Enter a whole number.";return}
      if(answer===currentAnswer){points+=1;messageEl.textContent="Correct. Great job. Click Next Question.";messageEl.className="msg ok";resultPhotoEl.src="/correct.jpeg";resultPhotoEl.alt="Correct";if(MODE==="numbers")speak(`Correct. Great job. Latest points: ${points}.`)}
      else{points=0;messageEl.textContent=`Not quite. The correct answer was ${currentAnswer}. Click Next Question.`;messageEl.className="msg bad";resultPhotoEl.src="/Wrong.jpeg";resultPhotoEl.alt="Wrong";if(MODE==="numbers")speak(`Not quite. The correct answer was ${currentAnswer}. Latest points: ${points}.`)}
      resultPhotoEl.style.display="block";
      updatePointsDisplay(); roundFinished=true; nextBtn.style.display="inline-block"
    }
    window.speechSynthesis.onvoiceschanged=populateVoiceSelect;
    const refreshVoicesBtn = document.getElementById("refreshVoicesBtn");
    if(refreshVoicesBtn)refreshVoicesBtn.addEventListener("click",populateVoiceSelect);
    const generateBtn = document.getElementById("generateBtn");
    if(generateBtn)generateBtn.addEventListener("click",nextRound);
    const repeatBtn = document.getElementById("repeatBtn");
    if(repeatBtn)repeatBtn.addEventListener("click",()=>{if(!spokenText){messageEl.textContent="Click the start button first.";return}speak(spokenText)});
    document.getElementById("checkBtn").addEventListener("click",checkAnswer);
    nextBtn.addEventListener("click",nextRound);
    inputEl.addEventListener("keydown",(e)=>{if(e.key==="Enter")checkAnswer()});
    populateVoiceSelect(); updatePointsDisplay(); if(MODE==="numbers")applyAnswerInputRange(activeRangeStart,activeRangeEnd); else nextRound();
  </script>
</body>
</html>
"""

MODE_CONFIG = {
    "numbers": {
        "title": "Athu's Number App",
        "badge": "Numbers",
        "intro": "Set a range, listen carefully, and type the number you heard.",
        "start_label": "Generate Number",
        "answer_placeholder": "Enter number here",
        "accent": "#0f766e",
        "operation": "",
        "operation_display": "none",
        "number_display": "flex",
    },
    "addition": {
        "title": "Addition Practice",
        "badge": "Addition",
        "intro": "Solve each addition question. The question types rotate in round robin order.",
        "start_label": "Generate Sum",
        "answer_placeholder": "Enter answer here",
        "accent": "#2563eb",
        "operation": "+",
        "operation_display": "block",
        "number_display": "none",
    },
    "subtraction": {
        "title": "Subtraction Practice",
        "badge": "Subtraction",
        "intro": "Solve each subtraction question. The question types rotate in round robin order.",
        "start_label": "Generate Question",
        "answer_placeholder": "Enter answer here",
        "accent": "#be123c",
        "operation": "-",
        "operation_display": "block",
        "number_display": "none",
    },
}


@app.route("/")
def home() -> str:
    return render_template_string(LANDING_HTML)


def render_mode(mode: str) -> str:
    return render_template_string(MATHS_HTML, mode=mode, **MODE_CONFIG[mode])


@app.route("/numbers")
def numbers() -> str:
    return render_mode("numbers")


@app.route("/addition")
def addition() -> str:
    return render_mode("addition")


@app.route("/subtraction")
def subtraction() -> str:
    return render_mode("subtraction")


@app.route("/maths")
def maths() -> str:
    return redirect("/numbers")


@app.route("/correct.jpeg")
def correct_image():
    return send_from_directory(app.root_path, "correct.jpeg")


@app.route("/Wrong.jpeg")
def wrong_image():
    return send_from_directory(app.root_path, "Wrong.jpeg")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
