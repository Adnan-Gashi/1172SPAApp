// Quiz module variables
let quizId, studentName, questions = [], currentQuestionIndex = 0, totalQuestions = 0;
let score = 0, timer = null, timerSeconds = 0, currentQuestion = null;

// Initialize quiz
function initQuiz(id, name) {
  quizId = id;
  studentName = name;
  currentQuestionIndex = 0;
  score = 0;
  timerSeconds = 0;
  
  // Start timer and load questions
  startTimer();
  loadQuestions();
}

// Timer functions
function startTimer() {
  timerSeconds = 0;
  updateTimerDisplay();
  timer = setInterval(() => {
    timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  document.getElementById('timer').textContent = 
    `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// Load quiz questions
function loadQuestions() {
  fetch(`https://my-json-server.typicode.com/Adnan-Gashi/1172SPAApp/quizzes/${quizId}`)
    .then(response => response.ok ? response.json() : Promise.reject('Network error'))
    .then(quizData => {
      questions = quizData.questionIds || [];
      totalQuestions = questions.length;
      document.getElementById('questionCounter').textContent = `Question 1 of ${totalQuestions}`;
      
      // Load first question
      if (questions.length > 0) {
        loadQuizQuestion(questions[0]);
      }
    })
    .catch(error => console.error('Error loading quiz:', error));
}

// Load a specific question
function loadQuizQuestion(questionId) {
  fetch(`https://my-json-server.typicode.com/Adnan-Gashi/1172SPAApp/questions/${questionId}`)
    .then(response => response.ok ? response.json() : Promise.reject('Network error'))
    .then(questionData => {
      currentQuestion = questionData;
      
      // Render the question based on its type
      if (questionData.type === "multipleChoice") {
        renderMultipleChoiceQuestion(questionData);
      } else if (questionData.type === "narrative") {
        renderNarrativeQuestion(questionData);
      } else if (questionData.type === "imageSelection") {
        renderImageSelectionQuestion(questionData);
      }
      
      document.getElementById('questionCounter').textContent = 
        `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
    })
    .catch(error => console.error('Error loading question:', error));
}

// Render different question types
function renderMultipleChoiceQuestion(questionData) {
  const container = document.getElementById('question-container');
  container.innerHTML = `
    <h3>${questionData.question}</h3>
    <div class="options-container">
      ${questionData.options.map(option => 
        `<button class="option-btn" onclick="checkAnswer(${option.id})">${option.text}</button>`
      ).join('')}
    </div>
  `;
}

function renderNarrativeQuestion(questionData) {
  const container = document.getElementById('question-container');
  container.innerHTML = `
    <h3>${questionData.question}</h3>
    <input type="text" class="narrative-input form-control" id="narrativeAnswer" placeholder="Type your answer here...">
    <button class="btn btn-primary submit-btn" onclick="checkNarrativeAnswer()">Submit Answer</button>
  `;
}

function renderImageSelectionQuestion(questionData) {
  const container = document.getElementById('question-container');
  
  // Create question text
  let html = `<h3>${questionData.question}</h3><div class="image-options-container">`;
  
  // Create image options
  questionData.options.forEach((option, index) => {
    const imagePath = !option.imagePath.startsWith('http') && !option.imagePath.startsWith('/') 
      ? `./images/${option.imagePath}` 
      : option.imagePath;
      
    const label = option.label || `Option ${index + 1}`;
    
    html += `
      <div class="image-option" onclick="checkAnswer(${option.id})">
        <img src="${imagePath}" alt="${label}" onerror="this.onerror=null; this.parentNode.innerHTML += '<div>Image failed to load</div>';">
        <p>${label}</p>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
  
  // Debug image paths
  console.log('Image paths:', questionData.options.map(o => o.imagePath));
}

// Answer checking functions
function checkAnswer(selectedOptionId) {
  const isCorrect = selectedOptionId === currentQuestion.correctAnswer;
  
  if (isCorrect) {
    score++;
    document.getElementById('scoreValue').textContent = score;
    window.showCorrectFeedback(getRandomEncouragingMessage());
  } else {
    window.showIncorrectFeedback(currentQuestion.explanation);
  }
}

function checkNarrativeAnswer() {
  const userAnswer = document.getElementById('narrativeAnswer').value.trim().toLowerCase();
  const correctAnswers = Array.isArray(currentQuestion.correctAnswer) 
    ? currentQuestion.correctAnswer.map(a => a.toLowerCase())
    : [currentQuestion.correctAnswer.toLowerCase()];
  
  if (correctAnswers.includes(userAnswer)) {
    score++;
    document.getElementById('scoreValue').textContent = score;
    window.showCorrectFeedback(getRandomEncouragingMessage());
  } else {
    window.showIncorrectFeedback(currentQuestion.explanation);
  }
}

// Load next question or finish quiz
function loadNextQuestion() {
  currentQuestionIndex++;
  
  if (currentQuestionIndex < totalQuestions) {
    loadQuizQuestion(questions[currentQuestionIndex]);
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  stopTimer();
  const scorePercentage = Math.round((score / totalQuestions) * 100);
  window.showResults(scorePercentage, timerSeconds);
}

// Helper function
function getRandomEncouragingMessage() {
  const messages = ['Excellent!', 'Well done!', 'Awesome!', 'Brilliant!', 'Great job!'];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Expose necessary functions
window.initQuiz = initQuiz;
window.loadNextQuestion = loadNextQuestion;
window.checkAnswer = checkAnswer;
window.checkNarrativeAnswer = checkNarrativeAnswer;