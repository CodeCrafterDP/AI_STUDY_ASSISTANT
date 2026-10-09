const quizQuestions = [
  {
    question: "Which statement best describes supervised learning?",
    options: [
      "A model learns from labelled examples",
      "A model groups data without target labels",
      "A system stores data without learning patterns",
      "A model learns only through rewards and penalties"
    ],
    correct: 0,
    explanation: "Supervised learning uses labelled training examples, where the expected output is provided to the model."
  },
  {
    question: "Which task is a typical example of classification?",
    options: [
      "Predicting tomorrow's temperature in degrees",
      "Estimating the price of a house",
      "Labelling an email as spam or not spam",
      "Forecasting monthly sales revenue"
    ],
    correct: 2,
    explanation: "Classification predicts a discrete category, such as spam or not spam. The other examples predict numeric values."
  },
  {
    question: "What is the main purpose of a test dataset?",
    options: [
      "To fit model parameters during training",
      "To evaluate performance on unseen examples",
      "To replace missing values in every feature",
      "To guarantee that a model has no bias"
    ],
    correct: 1,
    explanation: "A held-out test set estimates how well the trained model generalizes to data it did not use during fitting."
  },
  {
    question: "Which situation most strongly suggests overfitting?",
    options: [
      "Low training performance and low test performance",
      "Similar performance on training and test data",
      "High test performance with no training data",
      "Very high training performance but poor test performance"
    ],
    correct: 3,
    explanation: "Overfitting occurs when a model fits training-specific patterns too closely and performs poorly on unseen data."
  },
  {
    question: "Which metric is the fraction of all predictions that are correct?",
    options: [
      "Recall",
      "Accuracy",
      "Precision",
      "Mean absolute error"
    ],
    correct: 1,
    explanation: "Accuracy is the number of correct predictions divided by the total number of predictions. Precision and recall focus on positive-class predictions."
  }
];

const startQuizButton = document.getElementById("startQuiz");
const quizIntro = document.getElementById("quizIntro");
const quizForm = document.getElementById("quizForm");
const questionsContainer = document.getElementById("questionsContainer");
const resultsPanel = document.getElementById("resultsPanel");
const progressFill = document.getElementById("progressFill");
const questionProgress = document.getElementById("questionProgress");
const answeredProgress = document.getElementById("answeredProgress");
const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function renderQuestions() {
  questionsContainer.innerHTML = quizQuestions.map((item, index) => `
    <fieldset class="question-block">
      <legend class="question-title"><span class="question-number">QUESTION ${String(index + 1).padStart(2, "0")}</span><br>${item.question}</legend>
      <div class="option-list">
        ${item.options.map((option, optionIndex) => `
          <label class="option-label">
            <input type="radio" name="question-${index}" value="${optionIndex}" />
            <span class="option-letter">${String.fromCharCode(65 + optionIndex)}</span>
            <span>${option}</span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `).join("");

  quizForm.querySelectorAll('input[type="radio"]').forEach(input => {
    input.addEventListener("change", updateProgress);
  });
  updateProgress();
}

function updateProgress() {
  const answered = quizQuestions.filter((_, index) => quizForm.querySelector(`input[name="question-${index}"]:checked`)).length;
  answeredProgress.textContent = `${answered} of ${quizQuestions.length} answered`;
  progressFill.style.width = `${(answered / quizQuestions.length) * 100}%`;
  questionProgress.textContent = `QUESTION SET · ${String(quizQuestions.length).padStart(2, "0")} QUESTIONS`;
}

function openQuiz() {
  quizIntro.hidden = true;
  resultsPanel.hidden = true;
  quizForm.hidden = false;
  renderQuestions();
  document.getElementById("quizCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetQuiz() {
  quizForm.reset();
  resultsPanel.hidden = true;
  quizIntro.hidden = false;
  quizForm.hidden = true;
  progressFill.style.width = "0%";
  document.getElementById("quizCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

function submitQuiz(event) {
  event.preventDefault();
  const answers = quizQuestions.map((_, index) => {
    const selected = quizForm.querySelector(`input[name="question-${index}"]:checked`);
    return selected ? Number(selected.value) : null;
  });

  const unanswered = answers.filter(answer => answer === null).length;
  if (unanswered > 0) {
    const proceed = window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway? Unanswered questions will be marked incorrect.`);
    if (!proceed) {
      const firstMissing = answers.findIndex(answer => answer === null);
      const missingBlock = questionsContainer.children[firstMissing];
      missingBlock?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }

  const correctCount = answers.reduce((total, answer, index) => total + (answer === quizQuestions[index].correct ? 1 : 0), 0);
  const incorrectCount = quizQuestions.length - correctCount;
  const percent = Math.round((correctCount / quizQuestions.length) * 100);

  document.getElementById("scorePercent").textContent = `${percent}%`;
  document.getElementById("correctCount").textContent = correctCount;
  document.getElementById("incorrectCount").textContent = incorrectCount;
  document.getElementById("totalCount").textContent = quizQuestions.length;
  document.getElementById("resultTitle").textContent =
    percent === 100 ? "Excellent work." :
    percent >= 60 ? "Good progress. Keep going." :
    "A useful first attempt.";
  document.getElementById("resultMessage").textContent =
    `You answered ${correctCount} out of ${quizQuestions.length} questions correctly. Review the explanations below to strengthen your understanding.`;

  document.getElementById("answerReview").innerHTML = quizQuestions.map((item, index) => {
    const answer = answers[index];
    const isCorrect = answer === item.correct;
    const chosenText = answer === null ? "Not answered" : item.options[answer];
    return `
      <article class="review-item ${isCorrect ? "correct" : "incorrect"}">
        <div class="review-top">
          <span class="review-label">QUESTION ${String(index + 1).padStart(2, "0")}</span>
          <span class="review-status">${isCorrect ? "✓ Correct" : "× Incorrect"}</span>
        </div>
        <h5 class="review-question">${item.question}</h5>
        <p class="review-answer"><strong>Your answer:</strong> ${chosenText}</p>
        ${!isCorrect ? `<p class="review-answer"><strong>Correct answer:</strong> ${item.options[item.correct]}</p>` : ""}
        <p class="review-explanation"><strong>Explanation:</strong> ${item.explanation}</p>
      </article>
    `;
  }).join("");

  quizForm.hidden = true;
  resultsPanel.hidden = false;
  document.getElementById("quizCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

startQuizButton.addEventListener("click", openQuiz);
document.getElementById("submitQuiz").addEventListener("click", () => {});
quizForm.addEventListener("submit", submitQuiz);
document.getElementById("resetQuiz").addEventListener("click", () => {
  if (window.confirm("Clear your selected answers and start over?")) openQuiz();
});
document.getElementById("retryQuiz").addEventListener("click", openQuiz);
document.getElementById("backToIntro").addEventListener("click", resetQuiz);

document.getElementById("sourceSelector").addEventListener("click", () => {
  showToast("Demo source selected: Introduction to Machine Learning.pdf");
});
document.getElementById("addSourceButton").addEventListener("click", () => {
  document.getElementById("pdfInput").click();
});
document.getElementById("pdfInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    showToast("Please choose a file smaller than 10 MB.");
    event.target.value = "";
    return;
  }
  document.getElementById("sourceStatus").textContent = `${file.name} · selected locally`;
  document.getElementById("sourceCount").textContent = "1";
  document.getElementById("materialCount").textContent = "01";
  document.getElementById("selectedSourceText").textContent = "1 source selected";
  document.getElementById("passageCount").textContent = "File selected locally; analysis is not connected.";
  showToast("File selected for the design demo. PDF analysis is not connected yet.");
});

document.getElementById("mobileMenu").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});
document.addEventListener("click", event => {
  const sidebar = document.getElementById("sidebar");
  if (window.innerWidth <= 700 && sidebar.classList.contains("open") &&
      !sidebar.contains(event.target) && !event.target.closest("#mobileMenu")) {
    sidebar.classList.remove("open");
  }
});

// Start from the introductory state; questions are rendered only when the user begins.
