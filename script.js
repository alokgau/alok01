
let questions = JSON.parse(localStorage.getItem("neetQuestions") || "[]");

let testQuestions = [];
let selectedAnswers = [];
let currentQuestion = 0;
let timeLeft = 3600;
let timerInterval = null;
let submitted = false;
let language = "hi";

const $ = id => document.getElementById(id);
const subjects = ["Physics", "Chemistry", "Botany", "Zoology"];

const subjectHindi = {
  Physics: "भौतिक विज्ञान",
  Chemistry: "रसायन विज्ञान",
  Botany: "वनस्पति विज्ञान",
  Zoology: "प्राणी विज्ञान",
  All: "चारों विषय"
};

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function saveQuestions() {
  localStorage.setItem("neetQuestions", JSON.stringify(questions));
  updateQuestionCount();
}

function updateQuestionCount() {
  $("questionCount").textContent =
    "कुल सेव प्रश्न: " + questions.length;
}

// Navigation tabs
document.querySelectorAll(".tab").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".tab").forEach(b =>
      b.classList.remove("active")
    );

    button.classList.add("active");

    ["practice", "create", "info"].forEach(id => {
      $(id).hidden = id !== button.dataset.tab;
    });
  };
});

// Language toggle
$("languageBtn").onclick = () => {
  language = language === "hi" ? "en" : "hi";

  $("languageBtn").textContent =
    language === "hi" ? "English" : "हिंदी";

  $("chooseTitle").textContent =
    language === "hi" ? "अपना टेस्ट चुनें" : "Choose Your Test";

  $("heroSubtitle").textContent =
    language === "hi"
      ? "Physics • Chemistry • Biology | अभ्यास करें, टेस्ट दें, परिणाम देखें"
      : "Physics • Chemistry • Biology | Practice, Take Test, See Results";

  document.querySelectorAll(".start-btn[data-subject]").forEach(btn => {
    btn.textContent =
      language === "hi" ? "टेस्ट शुरू करें →" : "Start Test →";
  });

  if (!$("testScreen").hidden) showQuestion();
};

// Test size information
$("testSize").onchange = () => {
  const size = Number($("testSize").value);

  $("sizeInfo").textContent = size === 60
    ? "चारों विषयों के 15-15 प्रश्न (कुल 60) — 60 मिनट।"
    : "चारों विषयों के 45-45 प्रश्न (कुल 180) — 180 मिनट।";
};

// Add question
$("saveQuestion").onclick = () => {
  const q = {
    subject: $("newSubject").value,
    en: $("questionEn").value.trim(),
    hi: $("questionHi").value.trim(),
    options: [
      $("optionA").value.trim(),
      $("optionB").value.trim(),
      $("optionC").value.trim(),
      $("optionD").value.trim()
    ],
    answer: Number($("correctAnswer").value)
  };

  if (!q.en || !q.hi || q.options.some(option => !option)) {
    alert("कृपया प्रश्न, हिंदी अनुवाद और चारों विकल्प भरें।");
    return;
  }

  questions.push(q);
  saveQuestions();

  $("savedMessage").textContent = "प्रश्न सफलतापूर्वक सेव हो गया!";

  $("questionEn").value = "";
  $("questionHi").value = "";

  ["optionA", "optionB", "optionC", "optionD"].forEach(id => {
    $(id).value = "";
  });
};

updateQuestionCount();

// Start subject or mixed test
document.querySelectorAll(".start-btn[data-subject]").forEach(button => {
  button.onclick = () => {
    const subject = button.dataset.subject;
    const size = Number($("testSize").value);
    const perSubject = size === 60 ? 15 : 45;

    let selected = [];

    if (subject === "All") {
      for (const s of subjects) {
        const subjectQuestions = questions.filter(q => q.subject === s);

        if (subjectQuestions.length < perSubject) {
          alert(
            s + " में कम से कम " + perSubject +
            " प्रश्न जोड़ें। अभी " + subjectQuestions.length + " हैं।"
          );
          return;
        }

        selected.push(...shuffle(subjectQuestions).slice(0, perSubject));
      }
    } else {
      const subjectQuestions = questions.filter(q => q.subject === subject);

      if (subjectQuestions.length < perSubject) {
        alert(
          subject + " में कम से कम " + perSubject +
          " प्रश्न जोड़ें। अभी " + subjectQuestions.length + " हैं।"
        );
        return;
      }

      selected = shuffle(subjectQuestions).slice(0, perSubject);
    }

    testQuestions = shuffle(selected);
    selectedAnswers = Array(testQuestions.length).fill(null);
    currentQuestion = 0;
    submitted = false;

    timeLeft = size === 60 ? 3600 : 10800;

    $("practice").hidden = true;
    $("create").hidden = true;
    $("info").hidden = true;
    $("testScreen").hidden = false;

    showQuestion();
    startTimer();
    window.scrollTo(0, 0);
  };
});

// Display question
function showQuestion() {
  const q = testQuestions[currentQuestion];

  $("questionNumber").textContent =
    `Question ${currentQuestion + 1} / ${testQuestions.length}`;

  $("testSubject").textContent =
    language === "hi"
      ? subjectHindi[q.subject]
      : q.subject;

  $("testQuestion").textContent =
    language === "hi" ? q.hi : q.en;

  $("testOptions").innerHTML = "";

  q.options.forEach((option, index) => {
    const label = document.createElement("label");
    const radio = document.createElement("input");

    radio.type = "radio";
    radio.name = "testAnswer";
    radio.checked = selectedAnswers[currentQuestion] === index;

    radio.addEventListener("change", () => {
      selectedAnswers[currentQuestion] = index;
    });

    label.appendChild(radio);
    label.appendChild(document.createTextNode(
      " " + String.fromCharCode(65 + index) + ". " + option
    ));

    $("testOptions").appendChild(label);
  });

  $("previousBtn").disabled = currentQuestion === 0;
  $("nextBtn").disabled =
    currentQuestion === testQuestions.length - 1;
}

$("previousBtn").onclick = () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion();
  }
};

$("nextBtn").onclick = () => {
  if (currentQuestion < testQuestions.length - 1) {
    currentQuestion++;
    showQuestion();
  }
};

// Timer
function startTimer() {
  clearInterval(timerInterval);
  updateTimer();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitTest();
    }
  }, 1000);
}

function updateTimer() {
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  $("timer").textContent = [hours, minutes, seconds]
    .map(n => String(n).padStart(2, "0"))
    .join(":");
}

// Submit test
$("submitBtn").onclick = () => {
  if (confirm("क्या आप टेस्ट सबमिट करना चाहते हैं?")) {
    submitTest();
  }
};

function submitTest() {
  if (submitted) return;

  submitted = true;
  clearInterval(timerInterval);

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  testQuestions.forEach((q, i) => {
    if (selectedAnswers[i] === null) {
      unanswered++;
    } else if (selectedAnswers[i] === q.answer) {
      correct++;
    } else {
      wrong++;
    }
  });

  const score = correct * 4 - wrong;

  $("testScreen").hidden = true;
  $("resultScreen").hidden = false;

  $("finalScore").textContent = score + " / " +
    (testQuestions.length * 4);

  $("correctResult").textContent = "सही उत्तर: " + correct;
  $("wrongResult").textContent = "गलत उत्तर: " + wrong;
  $("unansweredResult").textContent = "बिना उत्तर: " + unanswered;

  showReview();

  window.scrollTo(0, 0);
}

// Answer review
function showReview() {
  $("answerReview").innerHTML = "";

  testQuestions.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "review-item";

    const chosen = selectedAnswers[i];
    let status = "";

    if (chosen === null) {
      status = "unanswered";
    } else if (chosen === q.answer) {
      status = "correct";
    } else {
      status = "wrong";
    }

    item.classList.add(status);

    const questionText = language === "hi" ? q.hi : q.en;

    const chosenText = chosen === null
      ? "बिना उत्तर"
      : String.fromCharCode(65 + chosen) + ". " + q.options[chosen];

    const correctText =
      String.fromCharCode(65 + q.answer) + ". " + q.options[q.answer];

    const heading = document.createElement("strong");
    heading.textContent = `Q${i + 1}. ${questionText}`;

    const yourAnswer = document.createElement("p");
    yourAnswer.textContent = "आपका उत्तर: " + chosenText;

    const correctAnswer = document.createElement("p");
    correctAnswer.textContent = "सही उत्तर: " + correctText;

    const result = document.createElement("strong");
    result.textContent =
      status === "correct" ? "सही" :
      status === "wrong" ? "गलत" : "अनुत्तरित";

    item.append(heading, yourAnswer, correctAnswer, result);
    $("answerReview").appendChild(item);
  });
}
