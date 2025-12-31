// Navigation
document.querySelectorAll(".nav-link").forEach(a => {
  a.onclick = e => {
    e.preventDefault();
    document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-link").forEach(x => x.classList.remove("active"));
    const target = a.getAttribute("href").substring(1);
    document.getElementById(target).classList.add("active");
    a.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
});

// Pre-Test Data
const pretestData = [
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

// Post-Test Data
const quizData = [
  {
    question: "What happens to the output when the sampling frequency violates the Nyquist criterion?",
    options: [
      "The reconstructed signal perfectly matches the input",
      "The signal amplitude increases",
      "Aliasing occurs and the signal gets distorted",
      "Quantization error becomes zero"
    ],
    correct: 2,
    explanation: "When the sampling frequency is less than twice the message frequency, spectral overlapping occurs, known as aliasing. This causes distortion in the reconstructed signal, which can be clearly observed in the simulation."
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
    explanation: "Increasing the number of quantization levels reduces the quantization step size. As a result, the difference between the actual sample value and the quantized value decreases, thereby reducing quantization error."
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
    explanation: "The reconstructed signal differs from the original signal due to quantization error and the use of finite sampling frequency. These limitations prevent perfect reconstruction of the analog signal."
  },
  {
    question: "How is bit rate calculated in PCM?",
    options: [
      "Bit rate = Sampling frequency × Quantization levels",
      "Bit rate = Message frequency × Bits per sample",
      "Bit rate = Sampling frequency × Bits per sample",
      "Bit rate = Quantization error × Sampling frequency"
    ],
    correct: 2,
    explanation: "Bit rate in PCM is calculated as the product of sampling frequency and number of bits per sample. Bits per sample are determined using log2 of the number of quantization levels."
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
    explanation: "Increasing the bit rate improves signal quality by reducing quantization error and improving resolution. However, it also increases bandwidth requirements, resulting in a trade-off between quality and bandwidth efficiency."
  }
];

// Generate Pre-Test
function generatePretest() {
  const container = document.getElementById('pretestContainer');
  container.innerHTML = '';
  
  pretestData.forEach((q, index) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    questionCard.innerHTML = `
      <div class="question-number">Question ${index + 1}</div>
      <div class="question-text">${q.question}</div>
      <div class="options">
        ${q.options.map((opt, i) => `
          <div class="option" data-question="${index}" data-option="${i}">
            <input type="radio" name="pq${index}" id="pq${index}_${i}" value="${i}">
            <label for="pq${index}_${i}">${opt}</label>
          </div>
        `).join('')}
      </div>
      <div class="feedback" id="preFeedback${index}"></div>
    `;
    container.appendChild(questionCard);
  });
  
  // Add click handlers to options
  document.querySelectorAll('#pretestContainer .option').forEach(opt => {
    opt.addEventListener('click', function() {
      const radio = this.querySelector('input[type="radio"]');
      radio.checked = true;
    });
  });
}

// Submit Pre-Test
function submitPretest() {
  let score = 0;
  let answered = 0;
  
  pretestData.forEach((q, index) => {
    const selected = document.querySelector(`input[name="pq${index}"]:checked`);
    const feedback = document.getElementById(`preFeedback${index}`);
    const options = document.querySelectorAll(`.option[data-question="${index}"]`);
    
    if (selected) {
      answered++;
      const selectedValue = parseInt(selected.value);
      
      options.forEach((opt, i) => {
        opt.classList.remove('correct', 'incorrect');
        if (i === q.correct) {
          opt.classList.add('correct');
        } else if (i === selectedValue && selectedValue !== q.correct) {
          opt.classList.add('incorrect');
        }
      });
      
      if (selectedValue === q.correct) {
        score++;
        feedback.className = 'feedback correct show';
        feedback.innerHTML = `<strong>✓ Correct!</strong> ${q.explanation}`;
      } else {
        feedback.className = 'feedback incorrect show';
        feedback.innerHTML = `<strong>✗ Incorrect.</strong> The correct answer is: <strong>${q.options[q.correct]}</strong><br><br>${q.explanation}`;
      }
    }
  });
  
  if (answered < pretestData.length) {
    alert(`Please answer all questions. You have answered ${answered} out of ${pretestData.length} questions.`);
    return;
  }
  
  // Show results
  const percentage = (score / pretestData.length * 100).toFixed(0);
  document.getElementById('pretestScoreDisplay').textContent = `${score} / ${pretestData.length}`;
  document.getElementById('pretestResultMessage').innerHTML = `
    You scored ${percentage}%<br>
    ${percentage >= 80 ? '🎉 Great foundation!' : percentage >= 60 ? '👍 Solid start!' : '📚 Review theory before proceeding!'}
  `;
  document.getElementById('pretestResult').classList.add('show');
  document.getElementById('submitPretest').disabled = true;
  
  document.getElementById('pretestResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Retry Pre-Test
function retryPretest() {
  document.getElementById('pretestResult').classList.remove('show');
  document.getElementById('submitPretest').disabled = false;
  generatePretest();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Generate Post-Test
function generateQuiz() {
  const container = document.getElementById('quizContainer');
  container.innerHTML = '';
  
  quizData.forEach((q, index) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    questionCard.innerHTML = `
      <div class="question-number">Question ${index + 1}</div>
      <div class="question-text">${q.question}</div>
      <div class="options">
        ${q.options.map((opt, i) => `
          <div class="option" data-question="${index}" data-option="${i}">
            <input type="radio" name="q${index}" id="q${index}_${i}" value="${i}">
            <label for="q${index}_${i}">${opt}</label>
          </div>
        `).join('')}
      </div>
      <div class="feedback" id="feedback${index}"></div>
    `;
    container.appendChild(questionCard);
  });
  
  // Add click handlers to options
  document.querySelectorAll('.option').forEach(opt => {
    opt.addEventListener('click', function() {
      const radio = this.querySelector('input[type="radio"]');
      radio.checked = true;
    });
  });
}

// Submit Post-Test
function submitQuiz() {
  let score = 0;
  let answered = 0;
  
  quizData.forEach((q, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    const feedback = document.getElementById(`feedback${index}`);
    const options = document.querySelectorAll(`.option[data-question="${index}"]`);
    
    if (selected) {
      answered++;
      const selectedValue = parseInt(selected.value);
      
      options.forEach((opt, i) => {
        opt.classList.remove('correct', 'incorrect');
        if (i === q.correct) {
          opt.classList.add('correct');
        } else if (i === selectedValue && selectedValue !== q.correct) {
          opt.classList.add('incorrect');
        }
      });
      
      if (selectedValue === q.correct) {
        score++;
        feedback.className = 'feedback correct show';
        feedback.innerHTML = `<strong>✓ Correct!</strong> ${q.explanation}`;
      } else {
        feedback.className = 'feedback incorrect show';
        feedback.innerHTML = `<strong>✗ Incorrect.</strong> The correct answer is: <strong>${q.options[q.correct]}</strong><br><br>${q.explanation}`;
      }
    }
  });
  
  if (answered < quizData.length) {
    alert(`Please answer all questions. You have answered ${answered} out of ${quizData.length} questions.`);
    return;
  }
  
  // Show results
  const percentage = (score / quizData.length * 100).toFixed(0);
  document.getElementById('scoreDisplay').textContent = `${score} / ${quizData.length}`;
  document.getElementById('resultMessage').innerHTML = `
    You scored ${percentage}%<br>
    ${percentage >= 80 ? '🎉 Excellent work!' : percentage >= 60 ? '👍 Good job!' : '📚 Keep practicing!'}
  `;
  document.getElementById('quizResult').classList.add('show');
  document.getElementById('submitQuiz').disabled = true;
  
  // Scroll to results
  document.getElementById('quizResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Retry Post-Test
function retryQuiz() {
  document.getElementById('quizResult').classList.remove('show');
  document.getElementById('submitQuiz').disabled = false;
  generateQuiz();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize quizzes
generatePretest();
generateQuiz();

// Attach event listeners
document.getElementById('submitPretest').addEventListener('click', submitPretest);
document.getElementById('retryPretest').addEventListener('click', retryPretest);
document.getElementById('submitQuiz').addEventListener('click', submitQuiz);
document.getElementById('retryQuiz').addEventListener('click', retryQuiz);

// PCM Simulation Code
function grayEncode(n){ return n^(n>>1); }

function generateSignal(A,fm,Fs,signalType){
  const N = Fs*0.04;
  const t = [...Array(N)].map((_,i)=>i/Fs);
  let x=[];
  if(signalType==="sine")
    x=t.map(time=>A*Math.sin(2*Math.PI*fm*time));
  else if(signalType==="cosine")
    x=t.map(time=>A*Math.cos(2*Math.PI*fm*time));
  else {
    let noise = t.map(()=>Math.random()*2-1);
    for(let k=0;k<3;k++){
      noise=noise.map((v,i,arr)=>(arr[i-1]||0)+v+(arr[i+1]||0)/3);
    }
    x=noise.map(v=>v*A);
  }
  return {t,x};
}

function sampleSignal(t,x,Fs,Fsamp){
  const step = Math.max(1, Math.floor(Fs/Fsamp));
  const ts=[], xs=[];
  for(let i=0; i<x.length; i+=step){
    ts.push(t[i]); xs.push(x[i]);
  }
  return {ts,xs};
}

function quantizeFullSignal(t, x, L, A) {
  const delta = (2 * A) / L;
  const q = [];
  const levels = [];
  x.forEach(v => {
    let lvl = Math.floor((v + A) / delta);
    lvl = Math.max(0, Math.min(L - 1, lvl));
    const qv = -A + (lvl + 0.5) * delta;
    q.push(qv);
    levels.push(lvl);
  });
  return { q, levels };
}

function buildStaircase(t, q) {
  const sx = [];
  const sy = [];
  for (let i = 0; i < q.length - 1; i++) {
    sx.push(t[i]);
    sy.push(q[i]);
    if (q[i] !== q[i + 1]) {
      sx.push(t[i + 1]);
      sy.push(q[i]);
    }
  }
  sx.push(t[t.length - 1]);
  sy.push(q[q.length - 1]);
  return { sx, sy };
}

function encode(levels,L,enc){
  const nBits=Math.ceil(Math.log2(L));
  return levels.map(l=>{
    const val = enc==="gray" ? grayEncode(l) : l;
    return val.toString(2).padStart(nBits,"0");
  });
}

function reconstruct(qx,ts,t){
  return t.map(tt=>{
    const idx=ts.findIndex(x=>x>tt);
    const i = (idx===-1?ts.length-1:Math.max(0,idx-1));
    return qx[i];
  });
}

function buildZOH(ts, xs, t) {
  const y = [];
  let k = 0;
  for (let i = 0; i < t.length; i++) {
    if (k < ts.length - 1 && t[i] >= ts[k + 1]) {
      k++;
    }
    y.push(xs[k]);
  }
  return y;
}

function createStemPlot(ts, xs) {
  const stemX = [];
  const stemY = [];
  ts.forEach((t, i) => {
    stemX.push(t, t, null);
    stemY.push(0, xs[i], null);
  });
  
  return {
    stems: {
      x: stemX,
      y: stemY,
      mode: 'lines',
      line: { color: 'orange', width: 2 },
      name: 'Stems',
      showlegend: false
    },
    markers: {
      x: ts,
      y: xs,
      mode: 'markers',
      marker: { color: 'red', size: 8, symbol: 'circle' },
      name: 'Samples'
    }
  };
}

function updatePlots() {
  const A = +msgAmp.value;
  const fm = +msgFreq.value;
  const Fsamp = +sampFreq.value;
  const L = +quantLevels.value;
  const enc = encodingType.value;
  const signalType = document.getElementById("signalType").value;

  const ratio = (Fsamp / fm).toFixed(2);
  const nyquistRate = 2 * fm;
  
  document.getElementById('ratioText').innerHTML = 
    `<strong>Fs/Fm Ratio:</strong> ${ratio} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Sampling Freq:</strong> ${Fsamp} Hz &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Message Freq:</strong> ${fm} Hz`;
  
  const statusDiv = document.getElementById('nyquistStatus');
  if (Fsamp < nyquistRate) {
    statusDiv.innerHTML = `<span style="color:red; font-weight:bold;">⚠️ WARNING: Sampling frequency (${Fsamp} Hz) < Nyquist rate (${nyquistRate} Hz). Aliasing will occur!</span>`;
    statusDiv.style.background = '#ffe6e6';
    statusDiv.style.padding = '8px';
    statusDiv.style.borderRadius = '4px';
  } else {
    statusDiv.innerHTML = `<span style="color:green; font-weight:bold;">✓ Good: Sampling frequency meets Nyquist criterion (${nyquistRate} Hz required)</span>`;
    statusDiv.style.background = '#e6ffe6';
    statusDiv.style.padding = '8px';
    statusDiv.style.borderRadius = '4px';
  }

  const Fs = 8000;
  const { t, x } = generateSignal(A, fm, Fs, signalType);
  const { ts, xs } = sampleSignal(t, x, Fs, Fsamp);
  const { q: qFull, levels: levelsFull } = quantizeFullSignal(t, x, L, A);
  const { q: qSample, levels: levelsSample } = quantizeFullSignal(ts, xs, L, A);
  const decodedSignal = qSample;

  const encoded = encode(levelsSample, L, enc);
  const xr = reconstruct(qSample, ts, t);

  const mode1 = document.querySelector(".ch1-btn.active").dataset.type;
  let d1 = [];

  if (mode1 === "input") {
    d1 = [{
      x: t,
      y: x,
      mode: 'lines',
      line: { color: 'green' },
      name: 'Input signal'
    }];
  }
  else if (mode1 === "sampled") {
    const stemPlot = createStemPlot(ts, xs);
    d1 = [
      stemPlot.stems,
      stemPlot.markers
    ];
  }
  else if (mode1 === "quantized") {
    const { sx, sy } = buildStaircase(t, qFull);
    d1 = [
      { x: t, y: x, mode: "lines", line: { color: "green", width: 2 }, name: 'Original' },
      { x: sx, y: sy, mode: "lines", line: { color: "red", width: 3, shape: "hv" }, name: 'Quantized' }
    ];
  }
  else if (mode1 === "encoded") {
    const bits = encoded.join("").split("").map(b => +b);
    const time = bits.map((_, i) => i / bits.length);
    d1 = [{
      x: time,
      y: bits,
      mode: 'lines',
      line: { shape: 'hv', color: 'magenta' },
      name: 'Encoded'
    }];
  }

  Plotly.react("plot1", d1, { 
    margin: { t: 20 },
    xaxis: { title: "Time (s)" },
    yaxis: { title: "Amplitude (V)" }
  });

  const mode2 = document.querySelector(".ch2-btn.active").dataset.type;
  let d2 = [];

  if (mode2 === "reconstructed") {
    d2 = [
      { x: t, y: x, mode: 'lines', line: { color: 'green' }, name: 'Original signal' }
    ];
  }
  else if (mode2 === "decoded") {
    const decodedZOH = buildZOH(ts, qSample, t);
    d2 = [
      {
        x: t,
        y: decodedZOH,
        mode: "lines",
        line: { shape: "hv", color: "red", width: 3 },
        name: "Decoded (DAC output)"
      }
    ];
  }

  Plotly.react("plot2", d2, {
    margin: { t: 20 },
    xaxis: { title: "Time (s)" },
    yaxis: { title: "Amplitude (V)" }
  });
}

document.getElementById("simulateBtn").onclick = updatePlots;

document.querySelectorAll(".ch1-btn").forEach(btn=>{
  btn.onclick = () => {
    document.querySelectorAll(".ch1-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    updatePlots();
  };
});

document.querySelectorAll(".ch2-btn").forEach(btn=>{
  btn.onclick = () => {
    document.querySelectorAll(".ch2-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    updatePlots();
  };
});

updatePlots();