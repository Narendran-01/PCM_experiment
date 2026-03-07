/* ===== Navigation ===== */
document.querySelectorAll(".nav-link").forEach(function (a) {
  a.onclick = function (e) {
    e.preventDefault();
    document.querySelectorAll("section").forEach(function (s) { s.classList.remove("active"); });
    document.querySelectorAll(".nav-link").forEach(function (x) { x.classList.remove("active"); });
    document.getElementById(a.getAttribute("href").substring(1)).classList.add("active");
    a.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (a.getAttribute("href") === "#simulation") {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { updatePlots(); });
      });
    }
  };
});

/* ===== Read Control Values ===== */
function getMsgFreqHz() {
  return parseFloat(document.getElementById('msgFreqSlider').value) *
    parseFloat(document.getElementById('msgFreqUnit').value);
}

function getSampFreqHz() {
  return parseFloat(document.getElementById('sampFreqSlider').value) *
    parseFloat(document.getElementById('sampFreqUnit').value);
}

function getUnitText(id) {
  var s = document.getElementById(id);
  return s.options[s.selectedIndex].text;
}

/* ===== Live Labels ===== */
document.getElementById('msgAmp').addEventListener('input', function () {
  document.getElementById('ampDisplay').textContent = parseFloat(this.value).toFixed(1) + ' V';
});

function refreshMsgLabel() {
  document.getElementById('msgFreqDisplay').textContent =
    document.getElementById('msgFreqSlider').value + ' ' + getUnitText('msgFreqUnit');
}

function refreshSampLabel() {
  document.getElementById('sampFreqDisplay').textContent =
    document.getElementById('sampFreqSlider').value + ' ' + getUnitText('sampFreqUnit');
}

document.getElementById('msgFreqSlider').addEventListener('input', refreshMsgLabel);
document.getElementById('msgFreqUnit').addEventListener('change', refreshMsgLabel);
document.getElementById('sampFreqSlider').addEventListener('input', refreshSampLabel);
document.getElementById('sampFreqUnit').addEventListener('change', refreshSampLabel);

/* ===== DSP Helpers ===== */
function grayEncode(n) {
  return n ^ (n >> 1);
}

function generateSignal(A, fm, Fs, type) {
  var N = Math.round(Fs * 0.04), t = [], x = [];
  for (var i = 0; i < N; i++) t.push(i / Fs);
  if (type === 'sine') {
    t.forEach(function (v) { x.push(A * Math.sin(2 * Math.PI * fm * v)); });
  } else if (type === 'cosine') {
    t.forEach(function (v) { x.push(A * Math.cos(2 * Math.PI * fm * v)); });
  } else {
    var noise = t.map(function () { return Math.random() * 2 - 1; });
    for (var k = 0; k < 3; k++) {
      noise = noise.map(function (_, i, a) { return ((a[i - 1] || 0) + a[i] + (a[i + 1] || 0)) / 3; });
    }
    x = noise.map(function (v) { return v * A; });
  }
  return { t: t, x: x };
}

function sampleSignal(t, x, Fs, Fsamp) {
  var step = Math.max(1, Math.floor(Fs / Fsamp)), ts = [], xs = [];
  for (var i = 0; i < x.length; i += step) { ts.push(t[i]); xs.push(x[i]); }
  return { ts: ts, xs: xs };
}

function quantizeSignal(xArr, L, A) {
  var delta = (2 * A) / L, q = [], levels = [];
  xArr.forEach(function (v) {
    var lvl = Math.floor((v + A) / delta);
    lvl = Math.max(0, Math.min(L - 1, lvl));
    q.push(-A + (lvl + 0.5) * delta);
    levels.push(lvl);
  });
  return { q: q, levels: levels };
}

function buildStaircase(t, q) {
  var sx = [], sy = [];
  for (var i = 0; i < q.length - 1; i++) {
    sx.push(t[i]); sy.push(q[i]);
    if (q[i] !== q[i + 1]) { sx.push(t[i + 1]); sy.push(q[i]); }
  }
  sx.push(t[t.length - 1]); sy.push(q[q.length - 1]);
  return { sx: sx, sy: sy };
}

function encodeSignal(levels, L, enc) {
  var nb = Math.ceil(Math.log2(Math.max(L, 2)));
  return levels.map(function (l) {
    return (enc === 'gray' ? grayEncode(l) : l).toString(2).padStart(nb, '0');
  });
}

function buildZOH(ts, xs, t) {
  var y = [], k = 0;
  for (var i = 0; i < t.length; i++) {
    if (k < ts.length - 1 && t[i] >= ts[k + 1]) k++;
    y.push(xs[k]);
  }
  return y;
}

function stemTraces(ts, xs) {
  var sx = [], sy = [];
  ts.forEach(function (t, i) { sx.push(t, t, null); sy.push(0, xs[i], null); });
  return {
    stems: { x: sx, y: sy, mode: 'lines', line: { color: 'orange', width: 2 }, showlegend: false },
    markers: { x: ts, y: xs, mode: 'markers', marker: { color: 'red', size: 8, symbol: 'circle' }, name: 'Samples' }
  };
}

function baseLayout(A, t0, t1) {
  return {
    margin: { t: 20, b: 40, l: 60, r: 20 },
    autosize: true,
    xaxis: {
      title: 'Time',
      tickmode: 'array', tickvals: [t0, t1], ticktext: ['Start', 'End'],
      gridcolor: 'rgba(0,217,255,0.15)', gridwidth: 1
    },
    yaxis: {
      title: 'Amplitude (V)',
      tickmode: 'array',
      tickvals: [-A, -A / 2, 0, A / 2, A],
      ticktext: [(-A).toFixed(1), (-A / 2).toFixed(1), '0', (A / 2).toFixed(1), A.toFixed(1)],
      gridcolor: 'rgba(0,217,255,0.15)', gridwidth: 1, range: [-A * 1.2, A * 1.2]
    },
    plot_bgcolor: '#1a2332', paper_bgcolor: '#1a2332',
    font: { color: '#ffffff' },
    shapes: []
  };
}

function updateQuantBox(A, L, enc) {
  var delta = (2 * A) / L, nb = Math.ceil(Math.log2(Math.max(L, 2)));
  var html = '<table style="width:100%;color:#e0e0e0;font-size:12px;border-collapse:collapse;">'
    + '<tr style="border-bottom:1px solid var(--cyan);color:var(--cyan);font-weight:bold;">'
    + '<th style="padding:5px;">Level</th><th style="padding:5px;">Voltage (V)</th><th style="padding:5px;">Code</th></tr>';
  for (var i = L - 1; i >= 0; i--) {
    var v = (-A + (i + 0.5) * delta).toFixed(3);
    var c = (enc === 'gray' ? grayEncode(i) : i).toString(2).padStart(nb, '0');
    html += '<tr style="border-bottom:1px solid rgba(0,217,255,0.1);">'
      + '<td style="padding:5px;text-align:center;color:var(--cyan);">' + i + '</td>'
      + '<td style="padding:5px;text-align:center;">' + v + '</td>'
      + '<td style="padding:5px;text-align:center;font-family:monospace;color:#ffaa00;">' + c + '</td></tr>';
  }
  html += '</table><div style="margin-top:10px;padding:8px;background:var(--navy);border-radius:4px;font-size:11px;text-align:center;">'
    + '<div style="color:var(--cyan);font-weight:bold;">Step Size</div>'
    + '<div style="color:#ffaa00;font-size:14px;margin-top:3px;">' + delta.toFixed(4) + ' V</div></div>';
  document.getElementById('levelsTable').innerHTML = html;
}

/* ===== Main Render ===== */
function updatePlots() {
  var A = parseFloat(document.getElementById('msgAmp').value) || 5;
  var fm = getMsgFreqHz();
  var Fsamp = getSampFreqHz();
  var L = parseInt(document.getElementById('quantLevels').value) || 8;
  var enc = document.getElementById('encodingType').value;
  var type = document.getElementById('signalType').value;
  if (!A || !fm || !Fsamp || !L) return;

  var nyq = (2 * fm).toFixed(0), ratio = (Fsamp / fm).toFixed(2);
  document.getElementById('ratioText').innerHTML =
    '<strong>Fs/Fm Ratio:</strong> ' + ratio +
    ' &nbsp;|&nbsp; <strong>Fs:</strong> ' + Fsamp.toLocaleString() + ' Hz' +
    ' &nbsp;|&nbsp; <strong>Fm:</strong> ' + fm.toLocaleString() + ' Hz';

  var sd = document.getElementById('nyquistStatus');
  if (Fsamp < 2 * fm) {
    sd.innerHTML = '<span style="color:#ff4444;font-weight:bold;">WARNING: Fs (' + Fsamp +
      ' Hz) less than Nyquist rate (' + nyq + ' Hz). Aliasing will occur!</span>';
    sd.style.background = 'rgba(220,53,69,0.15)';
  } else {
    sd.innerHTML = '<span style="color:#28a745;font-weight:bold;">Good: Fs meets Nyquist criterion (min ' +
      nyq + ' Hz required)</span>';
    sd.style.background = 'rgba(40,167,69,0.15)';
  }

  updateQuantBox(A, L, enc);

  var Fs = 8000;
  var sig = generateSignal(A, fm, Fs, type);
  var t = sig.t, x = sig.x;
  var samp = sampleSignal(t, x, Fs, Fsamp);
  var ts = samp.ts, xs = samp.xs;
  var qFull = quantizeSignal(x, L, A).q;
  var qSampObj = quantizeSignal(xs, L, A);
  var qSamp = qSampObj.q, lSamp = qSampObj.levels;
  var encoded = encodeSignal(lSamp, L, enc);
  var t0 = t[0], t1 = t[t.length - 1];

  /* --- Channel 1 --- */
  var m1 = document.querySelector('.ch1-btn.active').dataset.type;
  var qBox = document.getElementById('quantLevelsDisplay');
  qBox.classList.toggle('visible', m1 === 'quantized');
  document.getElementById('ch1Wrapper').style.gridTemplateColumns = (m1 === 'quantized') ? '1fr 200px' : '1fr';

  var d1 = [], lay1 = baseLayout(A, t0, t1);
  if (m1 === 'input') {
    d1 = [{ x: t, y: x, mode: 'lines', line: { color: '#00d9ff', width: 2 }, name: 'Input Signal' }];
  } else if (m1 === 'sampled') {
    var sp = stemTraces(ts, xs); d1 = [sp.stems, sp.markers];
  } else if (m1 === 'quantized') {
    var sc = buildStaircase(t, qFull);
    var delta = (2 * A) / L, grid = [];
    for (var gi = 0; gi <= L; gi++) grid.push(-A + gi * delta);
    lay1.shapes = grid.map(function (yv) {
      return { type: 'line', x0: t0, x1: t1, y0: yv, y1: yv, line: { color: 'rgba(0,217,255,0.2)', width: 1, dash: 'dot' } };
    });
    d1 = [
      { x: t, y: x, mode: 'lines', line: { color: '#00d9ff', width: 2 }, name: 'Original' },
      { x: sc.sx, y: sc.sy, mode: 'lines', line: { color: 'red', width: 3, shape: 'hv' }, name: 'Quantized' }
    ];
  } else if (m1 === 'encoded') {
    var bits = encoded.join('').split('').map(Number);
    var tb = bits.map(function (_, i) { return i / bits.length; });
    d1 = [{ x: tb, y: bits, mode: 'lines', line: { shape: 'hv', color: 'magenta', width: 2 }, name: 'Encoded' }];
    lay1.yaxis = { title: 'Bit Value', tickmode: 'array', tickvals: [0, 1], ticktext: ['0', '1'], range: [-0.2, 1.4], gridcolor: 'rgba(0,217,255,0.15)' };
    lay1.xaxis = { title: 'Normalized Time', tickmode: 'array', tickvals: [0, 0.5, 1], ticktext: ['Start', 'Mid', 'End'], range: [-0.02, 1.02], gridcolor: 'rgba(0,217,255,0.15)' };
  }

  var ch1Container = document.querySelector('#ch1Wrapper .plot-container');
  var plot1Width = ch1Container ? ch1Container.offsetWidth : 0;
  if (plot1Width < 100) plot1Width = document.getElementById('simulation').offsetWidth - 60 || 800;
  lay1.width = plot1Width;
  lay1.height = 400;
  Plotly.react('plot1', d1, lay1, { responsive: false, displayModeBar: true });

  /* --- Channel 2 --- */
  var m2 = document.querySelector('.ch2-btn.active').dataset.type;
  var d2 = [], lay2 = baseLayout(A, t0, t1);
  if (m2 === 'reconstructed') {
    var xr = buildZOH(ts, qSamp, t);
    d2 = [
      { x: t, y: x, mode: 'lines', line: { color: '#00d9ff', width: 2 }, name: 'Original Signal' },
      { x: t, y: xr, mode: 'lines', line: { color: 'orange', width: 2, dash: 'dash' }, name: 'Reconstructed' }
    ];
  } else if (m2 === 'decoded') {
    var xd = buildZOH(ts, qSamp, t);
    d2 = [{ x: t, y: xd, mode: 'lines', line: { shape: 'hv', color: 'red', width: 3 }, name: 'Decoded (DAC output)' }];
  }

  var plot2El = document.getElementById('plot2');
  var plot2Width = plot2El ? plot2El.offsetWidth : 0;
  if (plot2Width < 100) plot2Width = document.getElementById('simulation').offsetWidth - 60 || 800;
  lay2.width = plot2Width;
  lay2.height = 350;
  Plotly.react('plot2', d2, lay2, { responsive: false, displayModeBar: true });
}

/* ===== Wire Buttons ===== */
document.getElementById('simulateBtn').addEventListener('click', updatePlots);

document.querySelectorAll('.ch1-btn').forEach(function (b) {
  b.addEventListener('click', function () {
    document.querySelectorAll('.ch1-btn').forEach(function (x) { x.classList.remove('active'); });
    b.classList.add('active');
    updatePlots();
  });
});

document.querySelectorAll('.ch2-btn').forEach(function (b) {
  b.addEventListener('click', function () {
    document.querySelectorAll('.ch2-btn').forEach(function (x) { x.classList.remove('active'); });
    b.classList.add('active');
    updatePlots();
  });
});

/* ===== Resize ===== */
function onResize() {
  if (document.getElementById('simulation').classList.contains('active')) updatePlots();
}

if (window.ResizeObserver) {
  var ro = new ResizeObserver(function () {
    clearTimeout(window._resizeTimer);
    window._resizeTimer = setTimeout(onResize, 150);
  });
  ro.observe(document.getElementById('simulation'));
}

window.addEventListener('resize', function () {
  clearTimeout(window._winResizeTimer);
  window._winResizeTimer = setTimeout(onResize, 200);
});

/* ===== Quiz Data ===== */
var pretestData = [
  {
    question: "If a fast-changing signal is sampled very slowly, what can be the expected outcome?",
    options: [
      "The signal will be reconstructed perfectly",
      "The signal may appear as a different lower-frequency signal",
      "The signal amplitude will increase",
      "The signal will only have quantization noise"
    ],
    correct: 1,
    explanation: "Slow sampling causes aliasing, making a high-frequency signal look like a lower-frequency one."
  },
  {
    question: "If I increase the sampling rate of the signal, would it make the signal quality better?",
    options: [
      "Yes, but only after a certain minimum rate is crossed",
      "Yes, it always improves signal quality",
      "No, sampling rate does not affect signal quality",
      "Only if the number of bits is also increased"
    ],
    correct: 0,
    explanation: "Increasing the sampling rate improves quality only until the Nyquist condition is satisfied."
  },
  {
    question: "What do you think quantization error depends upon?",
    options: [
      "Sampling frequency of the signal",
      "Frequency content of the signal",
      "Number of quantization levels",
      "Shape of the analog waveform"
    ],
    correct: 2,
    explanation: "Quantization error is determined by the step size, which depends on the number of bits used."
  },
  {
    question: "If I double the number of bits, what is likely to happen?",
    options: [
      "Sampling rate doubles",
      "Quantization error decreases and signal resolution improves",
      "Signal frequency range increases",
      "Aliasing is completely eliminated"
    ],
    correct: 1,
    explanation: "More bits mean finer amplitude resolution, reducing quantization noise."
  },
  {
    question: "Can the reconstructed signal ever be identical to the original signal?",
    options: [
      "Yes, always",
      "Yes, if the sampling rate is very high",
      "No, some distortion is always present in practical systems",
      "Only for low-frequency signals"
    ],
    correct: 2,
    explanation: "Practical PCM systems always have some loss due to sampling, quantization, and reconstruction limits."
  }
];

var quizData = [
  {
    question: "What happens to the output when the sampling frequency violates the Nyquist criterion?",
    options: [
      "The reconstructed signal perfectly matches the input",
      "The signal amplitude increases",
      "Aliasing occurs and the signal gets distorted",
      "Quantization error becomes zero"
    ],
    correct: 2,
    explanation: "When Fs is less than 2*Fm, spectral overlapping (aliasing) occurs, distorting the reconstructed signal."
  },
  {
    question: "How does increasing the number of quantization levels affect quantization error?",
    options: [
      "Quantization error increases",
      "Quantization error remains constant",
      "Quantization error decreases",
      "Quantization error becomes infinite"
    ],
    correct: 2,
    explanation: "More levels mean smaller step size, so the quantization error decreases."
  },
  {
    question: "Why does the reconstructed signal not exactly match the original signal?",
    options: [
      "Due to noise in the channel",
      "Due to quantization error and finite sampling rate",
      "Due to over-sampling",
      "Due to higher bit rate"
    ],
    correct: 1,
    explanation: "Quantization error and finite sampling prevent perfect reconstruction."
  },
  {
    question: "How is bit rate calculated in PCM?",
    options: [
      "Bit rate = Sampling frequency x Quantization levels",
      "Bit rate = Message frequency x Bits per sample",
      "Bit rate = Sampling frequency x Bits per sample",
      "Bit rate = Quantization error x Sampling frequency"
    ],
    correct: 2,
    explanation: "Bit rate = Fs x n, where n = log2(L) bits per sample."
  },
  {
    question: "From the simulation results, explain the trade-off between bit rate and signal quality.",
    options: [
      "Higher bit rate reduces signal quality",
      "Lower bit rate improves signal quality",
      "Higher bit rate improves signal quality but requires more bandwidth",
      "Bit rate has no effect on signal quality"
    ],
    correct: 2,
    explanation: "More bits improve resolution but increase bandwidth requirements."
  }
];

/* ===== Quiz Helpers ===== */
function buildQuiz(data, containerId, prefix) {
  var c = document.getElementById(containerId);
  c.innerHTML = '';
  data.forEach(function (q, i) {
    var card = document.createElement('div');
    card.className = 'question-card';
    card.innerHTML =
      '<div class="question-number">Question ' + (i + 1) + '</div>'
      + '<div class="question-text">' + q.question + '</div>'
      + '<div class="options">' + q.options.map(function (o, j) {
        return '<div class="option" data-question="' + i + '" data-option="' + j + '">'
          + '<input type="radio" name="' + prefix + i + '" id="' + prefix + i + '_' + j + '" value="' + j + '">'
          + '<label for="' + prefix + i + '_' + j + '">' + o + '</label></div>';
      }).join('') + '</div>'
      + '<div class="feedback" id="' + prefix + 'fb' + i + '"></div>';
    c.appendChild(card);
  });
  c.querySelectorAll('.option').forEach(function (o) {
    o.addEventListener('click', function () { o.querySelector('input[type=radio]').checked = true; });
  });
}

function gradeQuiz(data, prefix, scoreId, msgId, resultId, btnId) {
  var score = 0, answered = 0;
  data.forEach(function (q, i) {
    var sel = document.querySelector('input[name="' + prefix + i + '"]:checked');
    var fb = document.getElementById(prefix + 'fb' + i);
    var opts = document.querySelectorAll('.option[data-question="' + i + '"]');
    if (sel) {
      answered++;
      var sv = parseInt(sel.value);
      opts.forEach(function (o, j) {
        o.classList.remove('correct', 'incorrect');
        if (j === q.correct) o.classList.add('correct');
        else if (j === sv && sv !== q.correct) o.classList.add('incorrect');
      });
      if (sv === q.correct) {
        score++;
        fb.className = 'feedback correct show';
        fb.innerHTML = '<strong>Correct!</strong> ' + q.explanation;
      } else {
        fb.className = 'feedback incorrect show';
        fb.innerHTML = '<strong>Incorrect.</strong> Correct answer: <strong>' + q.options[q.correct] + '</strong><br><br>' + q.explanation;
      }
    }
  });
  if (answered < data.length) {
    alert('Please answer all ' + data.length + ' questions. (' + answered + ' answered)');
    return;
  }
  var pct = (score / data.length * 100).toFixed(0);
  document.getElementById(scoreId).textContent = score + ' / ' + data.length;
  document.getElementById(msgId).innerHTML = 'You scored ' + pct + '%<br>' +
    (pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep practicing!');
  document.getElementById(resultId).classList.add('show');
  document.getElementById(btnId).disabled = true;
  document.getElementById(resultId).scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ===== Init Quizzes ===== */
buildQuiz(pretestData, 'pretestContainer', 'pq');

document.getElementById('submitPretest').addEventListener('click', function () {
  gradeQuiz(pretestData, 'pq', 'pretestScoreDisplay', 'pretestResultMessage', 'pretestResult', 'submitPretest');
});

document.getElementById('retryPretest').addEventListener('click', function () {
  document.getElementById('pretestResult').classList.remove('show');
  document.getElementById('submitPretest').disabled = false;
  buildQuiz(pretestData, 'pretestContainer', 'pq');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

buildQuiz(quizData, 'quizContainer', 'q');

document.getElementById('submitQuiz').addEventListener('click', function () {
  gradeQuiz(quizData, 'q', 'scoreDisplay', 'resultMessage', 'quizResult', 'submitQuiz');
});

document.getElementById('retryQuiz').addEventListener('click', function () {
  document.getElementById('quizResult').classList.remove('show');
  document.getElementById('submitQuiz').disabled = false;
  buildQuiz(quizData, 'quizContainer', 'q');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===== Help Popup ===== */
document.getElementById('helpBtn').addEventListener('click', function () {
  document.getElementById('helpPopup').style.display = 'block';
});

document.getElementById('closeHelp').addEventListener('click', function () {
  document.getElementById('helpPopup').style.display = 'none';
});

/* ===== Presets ===== */
function applyNyquistGood() {
  document.getElementById('msgFreqSlider').value = 100;
  document.getElementById('msgFreqUnit').value = 1;
  document.getElementById('sampFreqSlider').value = 1000;
  document.getElementById('sampFreqUnit').value = 1;
  refreshMsgLabel(); refreshSampLabel(); updatePlots();
}

function applyNyquistBad() {
  document.getElementById('msgFreqSlider').value = 300;
  document.getElementById('msgFreqUnit').value = 1;
  document.getElementById('sampFreqSlider').value = 400;
  document.getElementById('sampFreqUnit').value = 1;
  refreshMsgLabel(); refreshSampLabel(); updatePlots();
}

/* ===== Load ===== */
window.addEventListener('load', function () {
  if (document.getElementById('simulation').classList.contains('active')) updatePlots();
});
