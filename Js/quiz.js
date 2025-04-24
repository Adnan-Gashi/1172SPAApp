// Global variables
let studentName = '';
let quizId = '';
let currentQuestion = 0;
let score = 0;
let quizQuestions = [];
let startTime = null;
let timerInterval = null;

// API endpoint
const API_BASE_URL = 'https://my-json-server.typicode.com/Adnan-Gashi/1172SPAApp';

// Compiling HBS templates
const welcomeTemplate = Handlebars.compile(document.getElementById('welcome-template').innerHTML);
const questionTemplate = Handlebars.compile(document.getElementById('question-template').innerHTML);
const feedbackTemplate = Handlebars.compile(document.getElementById('feedback-template').innerHTML);
const resultsTemplate = Handlebars.compile(document.getElementById('results-template').innerHTML);

// DOM Elements
const appContainer = document.getElementById('app-container');

// Initialize the application
function init() {
    renderWelcomeScreen();
}

// Render the welcome screen
function renderWelcomeScreen() {
    appContainer.innerHTML = welcomeTemplate();
    
    // Add event listener to the form
    document.getElementById('start-form').addEventListener('submit', function(e) {
        e.preventDefault();
        studentName = document.getElementById('student-name').value;
        quizId = document.getElementById('quiz-select').value;
        startQuiz();
    });
}


async function startQuiz() {
    try {
        // Reset quiz state
        currentQuestion = 0;
        score = 0;
        startTime = new Date();
        
        // Fetch data
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch quiz data');
        }
        
        const quizData = await response.json();
        quizQuestions = quizData.questions;
        
        
        startTimer();
        
        // Loads up the first question
        loadQuestion();
    } catch (error) {
        console.error('Error starting quiz:', error);
        appContainer.innerHTML = `<div class="alert alert-danger">Error loading quiz: ${error.message}</div>`;
    }
}

// Load a question
async function loadQuestion() {
    try {
        if (currentQuestion >= quizQuestions.length) {
            // End of quiz
            endQuiz();
            return;
        }
        
        // Fetches current question
        const questionId = quizQuestions[currentQuestion];
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch question data');
        }
        
        const questionData = await response.json();
        
        // Determine question type
        const isMultipleChoice = questionData.type === 'multiple-choice';
        const isTextAnswer = questionData.type === 'text';
        const isImageSelection = questionData.type === 'image-selection';
        
        // Render the question
        appContainer.innerHTML = questionTemplate({
            currentQuestionNumber: currentQuestion + 1,
            totalQuestions: quizQuestions.length,
            question: questionData,
            score: score,
            isMultipleChoice,
            isTextAnswer,
            isImageSelection
        });
        
        // Add event listeners based on question type
        if (isMultipleChoice || isTextAnswer) {
            document.getElementById('submit-answer').addEventListener('click', () => checkAnswer(questionData));
        } else if (isImageSelection) {
            document.querySelectorAll('.option-card').forEach(card => {
                card.addEventListener('click', () => {
                    const selectedIndex = card.dataset.value;
                    checkAnswer(questionData, selectedIndex);
                });
            });
        }
    } catch (error) {
        console.error('Error loading question:', error);
        appContainer.innerHTML = `<div class="alert alert-danger">Error loading question: ${error.message}</div>`;
    }
}


function checkAnswer(questionData, selectedIndex) {
    let userAnswer;
    let isCorrect = false;
    
    // Get user answer based on question type
    if (questionData.type === 'multiple-choice') {
        const selectedOption = document.querySelector('input[name="answer"]:checked');
        if (!selectedOption) return; 
        userAnswer = selectedOption.value;
        isCorrect = userAnswer === questionData.correctAnswer;
    } else if (questionData.type === 'text') {
        userAnswer = document.getElementById('text-answer').value;
        isCorrect = userAnswer.toLowerCase() === questionData.correctAnswer.toLowerCase();
    } else if (questionData.type === 'image-selection') {
        userAnswer = selectedIndex;
        isCorrect = parseInt(selectedIndex) === questionData.correctAnswer;
    }
    
    // Updates score
    if (isCorrect) {
        score++;
        showCorrectFeedback();
    } else {
        showIncorrectFeedback(questionData.correctAnswer, questionData.explanation);
    }
}

// Feedback for correct answer
function showCorrectFeedback() {
 
    appContainer.innerHTML = feedbackTemplate({
        correct: true,
        feedbackMessage: "Good Job!"
    });
    
    // Goes to next Question auto after 1 sec
    setTimeout(() => {
        currentQuestion++;
        loadQuestion();
    }, 1000);
}

// Show feedback for incorrect answer
function showIncorrectFeedback(correctAnswer, explanation) {
    appContainer.innerHTML = feedbackTemplate({
        correct: false,
        feedbackMessage: explanation || "That's not quite right.",
        correctAnswer: correctAnswer
    });
    
    // Event listener for "Got it" button
    document.getElementById('got-it').addEventListener('click', () => {
        currentQuestion++;
        loadQuestion();
    });
}


function endQuiz() {
    // Stops the timer
    clearInterval(timerInterval);
    
    // Timer Calculations
    const endTime = new Date();
    const totalTimeInSeconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(totalTimeInSeconds / 60);
    const seconds = totalTimeInSeconds % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Percentage Calculations
    const scorePercentage = (score / quizQuestions.length) * 100;
    const passed = scorePercentage >= 80;
    
    
    appContainer.innerHTML = resultsTemplate({
        message: passed 
            ? `Congratulations ${studentName}! You passed the quiz` 
            : `Sorry ${studentName}, you failed the quiz`,
        score,
        totalQuestions: quizQuestions.length,
        time: formattedTime
    });
    
    // Event listeners for retake and return buttons
    document.getElementById('retake-quiz').addEventListener('click', () => {
        startQuiz();
    });
    
    document.getElementById('return-home').addEventListener('click', () => {
        renderWelcomeScreen();
    });
}


function startTimer() {
    let seconds = 0;
    timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = formattedTime;
        }
    }, 1000);
}

// Initialize the app
window.addEventListener('DOMContentLoaded', init);
