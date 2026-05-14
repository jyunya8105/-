const display = document.getElementById('display');
const startStopBtn = document.getElementById('startStop');
const resetBtn = document.getElementById('reset');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const progressRing = document.getElementById('progressRing');

const CIRCUMFERENCE = 2 * Math.PI * 54; // r=54

let totalSeconds = 0;
let remaining = 0;
let intervalId = null;
let isRunning = false;
let isFinished = false;

function pad(n) {
  return String(n).padStart(2, '0');
}

function updateDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  display.textContent = `${pad(m)}:${pad(s)}`;
}

function updateProgress(remaining, total) {
  if (total === 0) {
    progressRing.style.strokeDashoffset = 0;
    return;
  }
  const fraction = remaining / total;
  const offset = CIRCUMFERENCE * (1 - fraction);
  progressRing.style.strokeDashoffset = offset;
}

function getInputSeconds() {
  const m = Math.max(0, parseInt(minutesInput.value) || 0);
  const s = Math.max(0, Math.min(59, parseInt(secondsInput.value) || 0));
  return m * 60 + s;
}

function start() {
  if (isFinished) reset();

  if (remaining === 0) {
    totalSeconds = getInputSeconds();
    remaining = totalSeconds;
    if (remaining === 0) return;
  }

  isRunning = true;
  startStopBtn.textContent = '一時停止';
  startStopBtn.classList.add('running');
  setInputsEnabled(false);

  intervalId = setInterval(() => {
    remaining--;
    updateDisplay(remaining);
    updateProgress(remaining, totalSeconds);

    if (remaining <= 0) {
      clearInterval(intervalId);
      intervalId = null;
      isRunning = false;
      isFinished = true;
      finish();
    }
  }, 1000);
}

function stop() {
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  startStopBtn.textContent = '再開';
  startStopBtn.classList.remove('running');
}

function reset() {
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  isFinished = false;
  remaining = 0;
  totalSeconds = 0;

  display.classList.remove('finished');
  progressRing.style.stroke = '#6060ff';
  startStopBtn.textContent = 'スタート';
  startStopBtn.classList.remove('running');
  setInputsEnabled(true);

  const m = Math.max(0, parseInt(minutesInput.value) || 0);
  const s = Math.max(0, Math.min(59, parseInt(secondsInput.value) || 0));
  updateDisplay(m * 60 + s);
  progressRing.style.strokeDashoffset = 0;
}

function finish() {
  display.classList.add('finished');
  progressRing.style.stroke = '#ff6060';
  progressRing.style.strokeDashoffset = CIRCUMFERENCE;
  startStopBtn.textContent = 'スタート';
  startStopBtn.classList.remove('running');
  setInputsEnabled(true);
  playAlarm();
}

function setInputsEnabled(enabled) {
  minutesInput.disabled = !enabled;
  secondsInput.disabled = !enabled;
}

function playAlarm() {
  // Generate a simple beep using Web Audio API
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beepPattern = [0, 200, 400, 600];
    beepPattern.forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.5, ctx.currentTime + delay / 1000);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.3);
      osc.start(ctx.currentTime + delay / 1000);
      osc.stop(ctx.currentTime + delay / 1000 + 0.3);
    });
  } catch (e) {
    // Audio not supported — silent fallback
  }
}

startStopBtn.addEventListener('click', () => {
  if (isRunning) {
    stop();
  } else {
    start();
  }
});

resetBtn.addEventListener('click', reset);

// Update display when inputs change (only when not running)
[minutesInput, secondsInput].forEach(input => {
  input.addEventListener('input', () => {
    if (!isRunning && !isFinished) {
      const total = getInputSeconds();
      updateDisplay(total);
      progressRing.style.strokeDashoffset = 0;
    }
  });
});

// Init
updateDisplay(getInputSeconds());
progressRing.style.strokeDasharray = CIRCUMFERENCE;
progressRing.style.strokeDashoffset = 0;
