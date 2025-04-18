const API_BASE = 'https://my-json-server.typicode.com/Adnan-Gashi/1172SPAApp';

let state = {
  taker: '',
  quizId: null,
  currentQuestion: 0,
  score: 0,
  startTime: null,
  total: 0,
  questionIds: [],
};

Handlebars.registerHelper('eq', (a, b) => a === b);



function loadTemp(id) {
  const source = document.getElementById(id).innerHTML;
  return Handlebars.compile(source);
}

function render(tempFunc, context = {}) {
  document.getElementById('app').innerHTML = tempFunc(context);
}

function showHome() {
  const homeTemp = loadTemp('home');
  render(homeTemp);
  document.getElementById('start-btn').onclick = start;
}

async function start() {
  state.taker = document.getElementById('name-input').value;
  state.quizId = document.getElementById('quiz-select').value;
  state.score = 0;
  state.currentQuestion = 0;
  state.startTime = Date.now();

  const quiz = await fetch(`${API_BASE}/quizzes/${state.quizId}`).then(r => r.json());
  state.questionIds = quiz.Questions;
  state.total = state.questionIds.length;
  loadNextQuestion();
}

async function loadNextQuestion() {
  if (state.currentQuestion >= state.total) {
    return showResult();
  }

  const questionId = state.questionIds[state.currentQuestion];
  const question = await fetch(`${API_BASE}/Questions/${questionId}`).then(r => r.json());
  const quizTemp = loadTemp('quiz-template');

  render(quizTemp, {
    question,
    currentIndex: state.currentQuestion + 1,
    total: state.total,
    score: state.score,
    elapsed: Math.floor((Date.now() - state.startTime) / 1000)
  });

  handleQuestionInteraction(question);
}

function handleQuestionInteraction(question) {
  if (question.qtype === 'multipleChoice') {
    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.onclick = () => handleAnswer(btn.textContent === question.correct, question.explanation);
    });
  } else if (question.qtype === 'narrative') {
    document.getElementById('submit-text').onclick = () => {
      const ans = document.getElementById('text-answer').value.trim().toLowerCase();
      handleAnswer(ans === question.answer.toLowerCase(), question.explanation);
    };
  } else if (question.qtype === 'image-select') {
    document.querySelectorAll('.question-img').forEach(img => {
      img.onclick = () => {
        const isCorrect = img.dataset.correct === 'true';
        handleAnswer(isCorrect, question.explanation);
      };
    });
  }
}

function handleAnswer(isCorrect, explanation) {
  if (isCorrect) {
    state.score++;
    const el = document.createElement('div');
    el.className = 'alert alert-success text-center mt-3';
    el.textContent = ['Great!', 'Awesome!', 'Nice work!'][Math.floor(Math.random() * 3)];
    document.getElementById('app').appendChild(el);
    setTimeout(() => {
      state.currentQuestion++;
      loadNextQuestion();
    }, 1000);
  } else {
    const feedbackTmpl = loadTemp('feedback-template');
    render(feedbackTmpl({ explanation }));
    document.getElementById('got-it').onclick = () => {
      state.currentQuestion++;
      loadNextQuestion();
    };
  }
}

function showResult() {
  const percent = Math.round((state.score / state.total) * 100);
  const resultTmpl = loadTemp('result-template');
  render(resultTmpl({
    score: percent,
    message: percent >= 80 ? `Congratulations ${state.taker}, You Pass the Quiz!` : `Sorry ${state.taker}, You Fail the Quiz.`
  }));

  document.getElementById('retry').onclick = () => start();
  document.getElementById('home').onclick = () => showHome();
}

// Initialize
(async () => {
  showHome();
})();
