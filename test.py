import os
from flask import Flask, render_template_string

app = Flask(__name__)

LANDING_HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Athu Learning Hub</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;font-family:Georgia,serif;background:linear-gradient(135deg,#f8f2e7,#ffe4cf);color:#202431}
    .wrap{width:min(960px,100%);display:grid;grid-template-columns:1.1fr .9fr;gap:18px}
    .card{background:rgba(255,252,247,.92);border-radius:28px;padding:28px;box-shadow:0 20px 50px rgba(0,0,0,.12)}
    .tag{display:inline-block;padding:8px 12px;border-radius:999px;background:#f3e8f2;color:#6d2e62;font-size:.85rem;text-transform:uppercase}
    h1{font-size:clamp(2.3rem,4vw,4.2rem);line-height:.95;max-width:10ch}
    .choice{display:block;text-decoration:none;color:inherit;padding:22px;border-radius:22px;background:#fff;margin-bottom:14px;border:1px solid rgba(0,0,0,.08)}
    .choice:hover{transform:translateY(-2px)}
    .choice span{font-size:.85rem;text-transform:uppercase;font-weight:700}
    @media (max-width:800px){.wrap{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="card">
      <div class="tag">Learning Hub</div>
      <h1>Choose today's learning adventure.</h1>
      <p>Pick English for phonics reading practice or Maths for number listening practice.</p>
    </section>
    <section class="card">
      <a class="choice" href="/english"><span>English</span><h2>Phonics Studio</h2><p>Tap letters and blend words.</p></a>
      <a class="choice" href="/maths"><span>Maths</span><h2>Number Listening</h2><p>Hear a number and type it.</p></a>
    </section>
  </main>
</body>
</html>
"""

ENGLISH_HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Phonics Studio</title>
  <style>
    body{margin:0;font-family:Georgia,serif;background:linear-gradient(135deg,#f7f0df,#ffe3ca);color:#1f2430}
    .page{width:min(1100px,100%);margin:0 auto;padding:22px}
    .hero,.side,.main{background:rgba(255,252,246,.92);border-radius:24px;padding:22px;box-shadow:0 16px 40px rgba(0,0,0,.1)}
    .top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
    .grid{display:grid;grid-template-columns:280px 1fr;gap:18px}
    .tiles,.controls{display:flex;gap:12px;flex-wrap:wrap}
    .tile,button{border:none;border-radius:18px;padding:16px 18px;font-size:1.2rem;font-weight:700}
    .tile{background:#fff;color:#1f2430;box-shadow:0 8px 18px rgba(0,0,0,.06);cursor:pointer;min-width:72px}
    button{background:#6f2d62;color:#fff;cursor:pointer}
    .ghost{background:#fff;color:#1f2430;border:1px solid #ddd}
    .secondary{background:#1f6c61}
    .word{font-size:clamp(2.5rem,5vw,4.8rem);color:#6f2d62}
    .note{background:#fff;border-radius:18px;padding:14px;margin-top:14px}
    a{text-decoration:none;color:#6f2d62;font-weight:700}
    @media (max-width:900px){.grid{grid-template-columns:1fr}}
    @media (max-width:640px){.tile,button{width:100%}}
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <div class="top">
        <h1>Phonics Studio</h1>
        <a href="/">Back to Hub</a>
      </div>
      <p>Tap each letter to hear its sound. Then use the blend button to hear the whole word slowly.</p>
    </section>
    <section class="grid" style="margin-top:18px">
      <aside class="side">
        <h2>Progress</h2>
        <p><strong id="wordCount">0</strong> words explored</p>
        <p><strong id="tapCount">0</strong> sound taps</p>
        <p><strong id="blendCount">0</strong> blends</p>
        <div class="note">Recorded files in `static/audio/sounds` are used first. Missing files fall back to speech.</div>
      </aside>
      <section class="main">
        <div class="word" id="currentWord">cat</div>
        <p id="promptText">Tap each tile to hear the phonics sound.</p>
        <div class="tiles" id="wordDisplay"></div>
        <div class="controls" style="margin-top:16px">
          <button id="soundWordBtn" type="button">Sound whole word</button>
          <button id="sayWordBtn" class="secondary" type="button">Say word clearly</button>
          <button id="newWordBtn" class="ghost" type="button">New random word</button>
        </div>
        <p id="feedback"></p>
        <div class="note">
          <p id="wordClue"></p>
          <p id="soundGuide"></p>
        </div>
      </section>
    </section>
  </div>
  <script>
    const WORD_BANK = [
      { word:"cat", clue:"a pet that says meow", sounds:[{text:"c",say:"kuh",audio:"/static/audio/sounds/c.mp3"},{text:"a",say:"a",audio:"/static/audio/sounds/a.mp3"},{text:"t",say:"tuh",audio:"/static/audio/sounds/t.mp3"}] },
      { word:"dog", clue:"a pet that barks", sounds:[{text:"d",say:"duh",audio:"/static/audio/sounds/d.mp3"},{text:"o",say:"o",audio:"/static/audio/sounds/o.mp3"},{text:"g",say:"guh",audio:"/static/audio/sounds/g.mp3"}] },
      { word:"sun", clue:"it shines in the sky", sounds:[{text:"s",say:"sss",audio:"/static/audio/sounds/s.mp3"},{text:"u",say:"u",audio:"/static/audio/sounds/u.mp3"},{text:"n",say:"nnn",audio:"/static/audio/sounds/n.mp3"}] },
      { word:"map", clue:"it helps you find places", sounds:[{text:"m",say:"mmm",audio:"/static/audio/sounds/m.mp3"},{text:"a",say:"a",audio:"/static/audio/sounds/a.mp3"},{text:"p",say:"puh",audio:"/static/audio/sounds/p.mp3"}] },
      { word:"bed", clue:"you sleep on it", sounds:[{text:"b",say:"buh",audio:"/static/audio/sounds/b.mp3"},{text:"e",say:"e",audio:"/static/audio/sounds/e.mp3"},{text:"d",say:"duh",audio:"/static/audio/sounds/d.mp3"}] },
      { word:"ship", clue:"a big boat", sounds:[{text:"s",say:"sss",audio:"/static/audio/sounds/s.mp3"},{text:"h",say:"h",audio:"/static/audio/sounds/h.mp3"},{text:"i",say:"i",audio:"/static/audio/sounds/i.mp3"},{text:"p",say:"puh",audio:"/static/audio/sounds/p.mp3"}] },
      { word:"chip", clue:"a crunchy snack", sounds:[{text:"c",say:"kuh",audio:"/static/audio/sounds/c.mp3"},{text:"h",say:"h",audio:"/static/audio/sounds/h.mp3"},{text:"i",say:"i",audio:"/static/audio/sounds/i.mp3"},{text:"p",say:"puh",audio:"/static/audio/sounds/p.mp3"}] }
    ];
    const state = { currentWord:null, wordsExplored:0, soundTaps:0, blends:0 };
    const wordDisplayEl = document.getElementById("wordDisplay");
    const currentWordEl = document.getElementById("currentWord");
    const feedbackEl = document.getElementById("feedback");
    const wordClueEl = document.getElementById("wordClue");
    const soundGuideEl = document.getElementById("soundGuide");
    const wordCountEl = document.getElementById("wordCount");
    const tapCountEl = document.getElementById("tapCount");
    const blendCountEl = document.getElementById("blendCount");
    let activeAudio = null;
    let sequenceToken = 0;
    function stopPlayback() {
      sequenceToken += 1;
      if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null; }
      window.speechSynthesis.cancel();
    }
    function speak(text, rate = 0.8) {
      stopPlayback();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-IN";
      utter.rate = rate;
      utter.pitch = 1;
      window.speechSynthesis.speak(utter);
    }
    function playAudioFile(src, fallbackText) {
      stopPlayback();
      const audio = new Audio(src);
      activeAudio = audio;
      audio.addEventListener("ended", () => { if (activeAudio === audio) activeAudio = null; });
      audio.addEventListener("error", () => { if (activeAudio === audio) activeAudio = null; speak(fallbackText); }, { once: true });
      audio.play().catch(() => { if (activeAudio === audio) activeAudio = null; speak(fallbackText); });
    }
    function playSoundSequence(sounds, onComplete) {
      stopPlayback();
      const token = sequenceToken;
      let index = 0;
      function playNext() {
        if (token !== sequenceToken) return;
        if (index >= sounds.length) { activeAudio = null; if (onComplete) onComplete(); return; }
        const sound = sounds[index];
        const audio = new Audio(sound.audio);
        activeAudio = audio;
        audio.addEventListener("ended", () => { if (token !== sequenceToken) return; index += 1; window.setTimeout(playNext, 380); }, { once: true });
        audio.addEventListener("error", () => { if (token !== sequenceToken) return; activeAudio = null; speak(sounds.map((item) => item.say).join(". "), 0.6); }, { once: true });
        audio.play().catch(() => { if (token !== sequenceToken) return; activeAudio = null; speak(sounds.map((item) => item.say).join(". "), 0.6); });
      }
      playNext();
    }
    function updateStats() {
      wordCountEl.textContent = String(state.wordsExplored);
      tapCountEl.textContent = String(state.soundTaps);
      blendCountEl.textContent = String(state.blends);
    }
    function soundGuide(word) {
      return "Sound guide: " + word.sounds.map((item) => "/" + item.say + "/").join(" ") + " -> " + word.word;
    }
    function speakSingleSound(index) {
      const sound = state.currentWord.sounds[index];
      state.soundTaps += 1;
      updateStats();
      feedbackEl.textContent = "Sound: " + sound.text + " says /" + sound.say + "/.";
      playAudioFile(sound.audio, sound.say);
    }
    function renderWord() {
      const word = state.currentWord;
      currentWordEl.textContent = word.word;
      wordClueEl.textContent = word.clue;
      soundGuideEl.textContent = soundGuide(word);
      wordDisplayEl.innerHTML = "";
      word.sounds.forEach((sound, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tile";
        button.textContent = sound.text;
        button.addEventListener("click", () => speakSingleSound(index));
        wordDisplayEl.appendChild(button);
      });
    }
    function chooseRandomWord() {
      let next = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
      if (state.currentWord && WORD_BANK.length > 1) {
        while (next.word === state.currentWord.word) next = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
      }
      state.currentWord = next;
      state.wordsExplored += 1;
      updateStats();
      renderWord();
      feedbackEl.textContent = "New word loaded. Tap each sound tile.";
    }
    function soundWholeWord() {
      const word = state.currentWord;
      state.blends += 1;
      updateStats();
      feedbackEl.textContent = "Blending the word: " + word.word;
      playSoundSequence(word.sounds, () => { window.setTimeout(() => speak(word.word, 0.62), 450); });
    }
    function sayWordClearly() {
      feedbackEl.textContent = "Whole word: " + state.currentWord.word;
      speak(state.currentWord.word);
    }
    document.getElementById("soundWordBtn").addEventListener("click", soundWholeWord);
    document.getElementById("sayWordBtn").addEventListener("click", sayWordClearly);
    document.getElementById("newWordBtn").addEventListener("click", chooseRandomWord);
    chooseRandomWord();
  </script>
</body>
</html>
"""

MATHS_HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Number Listening</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;font-family:"Trebuchet MS",sans-serif;background:linear-gradient(135deg,#fff7ed,#e0f2fe);color:#1f2937}
    .card{width:min(940px,100%);background:#fff;border-radius:20px;padding:24px;box-shadow:0 18px 45px rgba(0,0,0,.1)}
    .top,.row,.panes{display:flex;gap:10px;flex-wrap:wrap}
    .top{justify-content:space-between;align-items:center}
    .panes{display:grid;grid-template-columns:1fr 240px;gap:18px}
    .side{background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:14px}
    input,select,button{font-size:1rem;border-radius:12px;padding:10px 14px}
    input,select{border:1px solid #d1d5db}
    button{border:none;background:#0f766e;color:#fff;cursor:pointer}
    .ghost{background:#fff;color:#1f2937;border:1px solid #d1d5db}
    a{text-decoration:none;color:#6d2e62;font-weight:700}
    .msg{min-height:28px;font-weight:700}
    .ok{color:#166534}.bad{color:#b91c1c}
    @media (max-width:760px){.panes{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="card">
    <div class="top">
      <h1>Athu's Number App</h1>
      <a href="/">Back to Hub</a>
    </div>
    <p>Set a range, click Generate Number, listen carefully, and type what you heard.</p>
    <div class="panes">
      <section>
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
          <select id="voiceSelect" style="min-width:260px;max-width:100%;"></select>
          <button id="refreshVoicesBtn" class="ghost" type="button">Refresh Voices</button>
        </div>
        <div class="row">
          <input id="answerInput" type="number" min="0" max="500" placeholder="Enter number here" />
          <button id="checkBtn" type="button">Check Answer</button>
          <button id="nextBtn" type="button" style="display:none;">Next Number</button>
        </div>
        <div id="message" class="msg"></div>
      </section>
      <aside class="side">
        <h2>Points</h2>
        <p id="scoreValue" style="font-size:2.2rem;font-weight:800;color:#0f766e;margin:0">0</p>
      </aside>
    </div>
  </main>
  <script>
    let currentNumber = null, roundFinished = false, points = 0, activeRangeStart = 0, activeRangeEnd = 500, cachedVoices = [];
    const messageEl = document.getElementById("message");
    const inputEl = document.getElementById("answerInput");
    const startInputEl = document.getElementById("startInput");
    const endInputEl = document.getElementById("endInput");
    const nextBtn = document.getElementById("nextBtn");
    const voiceSelectEl = document.getElementById("voiceSelect");
    const scoreValueEl = document.getElementById("scoreValue");
    function updatePointsDisplay(){scoreValueEl.textContent=String(points)}
    function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}
    function applyAnswerInputRange(min,max){inputEl.min=String(min);inputEl.max=String(max);inputEl.placeholder=`Enter number (${min} to ${max})`}
    function getValidatedRange(){
      const start=Number(startInputEl.value.trim()), end=Number(endInputEl.value.trim());
      if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<0){messageEl.textContent="Range must be whole numbers 0 or greater.";return null}
      if(start>end){messageEl.textContent="Start range must be less than or equal to end range.";return null}
      return {start,end}
    }
    function pickPreferredVoice(){const voices=window.speechSynthesis.getVoices();return voices.find((v)=>v.lang.toLowerCase().startsWith("en"))||voices[0]||null}
    function populateVoiceSelect(){
      const voices=window.speechSynthesis.getVoices(); cachedVoices=voices; voiceSelectEl.innerHTML="";
      if(!voices.length){const opt=document.createElement("option");opt.value="";opt.textContent="No voices found yet";voiceSelectEl.appendChild(opt);return}
      const preferred=pickPreferredVoice();
      voices.forEach((voice,idx)=>{const opt=document.createElement("option");opt.value=String(idx);opt.textContent=`${voice.name} (${voice.lang})`;if(preferred&&voice.name===preferred.name&&voice.lang===preferred.lang)opt.selected=true;voiceSelectEl.appendChild(opt)})
    }
    function getSelectedVoice(){const idx=Number(voiceSelectEl.value);return Number.isInteger(idx)&&cachedVoices[idx]?cachedVoices[idx]:pickPreferredVoice()}
    function speak(text){window.speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);const voice=getSelectedVoice();if(voice)utter.voice=voice;utter.lang="en-IN";utter.rate=0.72;utter.pitch=1;window.speechSynthesis.speak(utter)}
    function nextRound(){
      const range=getValidatedRange(); if(!range)return;
      activeRangeStart=range.start; activeRangeEnd=range.end; applyAnswerInputRange(activeRangeStart,activeRangeEnd);
      currentNumber=randomInt(activeRangeStart,activeRangeEnd); roundFinished=false; messageEl.textContent=""; messageEl.className="msg"; inputEl.value=""; nextBtn.style.display="none"; inputEl.focus(); speak(String(currentNumber))
    }
    function checkAnswer(){
      if(currentNumber===null){messageEl.textContent="Click Generate Number first.";return}
      if(roundFinished){messageEl.textContent="Click Next Number to continue.";return}
      const value=inputEl.value.trim(); if(value===""){messageEl.textContent="Please enter a number.";return}
      const answer=Number(value);
      if(!Number.isInteger(answer)||answer<activeRangeStart||answer>activeRangeEnd){messageEl.textContent=`Enter a whole number from ${activeRangeStart} to ${activeRangeEnd}.`;return}
      if(answer===currentNumber){points+=1;messageEl.textContent="Correct. Great job. Click Next Number.";messageEl.className="msg ok";speak(`Correct. Great job. Latest points: ${points}.`)}
      else{points=0;messageEl.textContent=`Not quite. The correct number was ${currentNumber}. Click Next Number.`;messageEl.className="msg bad";speak(`Not quite. The correct number was ${currentNumber}. Latest points: ${points}.`)}
      updatePointsDisplay(); roundFinished=true; nextBtn.style.display="inline-block"
    }
    window.speechSynthesis.onvoiceschanged=populateVoiceSelect;
    document.getElementById("refreshVoicesBtn").addEventListener("click",populateVoiceSelect);
    document.getElementById("generateBtn").addEventListener("click",nextRound);
    document.getElementById("repeatBtn").addEventListener("click",()=>{if(currentNumber===null){messageEl.textContent="Click Generate Number first.";return}speak(String(currentNumber))});
    document.getElementById("checkBtn").addEventListener("click",checkAnswer);
    nextBtn.addEventListener("click",nextRound);
    inputEl.addEventListener("keydown",(e)=>{if(e.key==="Enter")checkAnswer()});
    populateVoiceSelect(); applyAnswerInputRange(activeRangeStart,activeRangeEnd); updatePointsDisplay();
  </script>
</body>
</html>
"""


@app.route("/")
def home() -> str:
    return render_template_string(LANDING_HTML)


@app.route("/english")
def english() -> str:
    return render_template_string(ENGLISH_HTML)


@app.route("/maths")
def maths() -> str:
    return render_template_string(MATHS_HTML)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
