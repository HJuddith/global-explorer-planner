/**
 * quiz.js
 * Quiz "Quel est votre prochain voyage idéal ?" conçu en
 * Programmation Orientée Objet (TP10) : classes Question et Quiz.
 */

class Question {
  constructor(prompt, options) {
    this.prompt = prompt;
    // options: [{ label, scores: { plage, montagne, ville, aventure } }]
    this.options = options;
  }
}

class Quiz {
  constructor(questions, profiles) {
    this.questions = questions;
    this.profiles = profiles; // { key: { title, description } }
    this.currentIndex = 0;
    this.scores = Object.keys(profiles).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  }

  get currentQuestion() {
    return this.questions[this.currentIndex];
  }

  get isFinished() {
    return this.currentIndex >= this.questions.length;
  }

  answer(optionIndex) {
    const option = this.currentQuestion.options[optionIndex];
    Object.entries(option.scores).forEach(([key, points]) => {
      this.scores[key] = (this.scores[key] || 0) + points;
    });
    this.currentIndex += 1;
  }

  reset() {
    this.currentIndex = 0;
    this.scores = Object.keys(this.profiles).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  }

  getResultProfile() {
    const topKey = Object.entries(this.scores).sort((a, b) => b[1] - a[1])[0][0];
    return { key: topKey, ...this.profiles[topKey] };
  }
}

const PROFILES = {
  plage: { title: "Escapade balnéaire 🏖️", description: "Vous rêvez de sable fin, d'eau turquoise et de farniente. Pensez aux Maldives, à la Grèce ou au Brésil." },
  montagne: { title: "Retraite en montagne 🏔️", description: "Grand air, sommets et randonnées vous appellent. Direction les Alpes, le Népal ou la Patagonie." },
  ville: { title: "Immersion urbaine 🏙️", description: "Musées, gastronomie et vie nocturne : les grandes villes du monde n'attendent que vous. Tokyo, New York, Lisbonne…" },
  aventure: { title: "Aventure et nature sauvage 🌿", description: "Vous cherchez l'inattendu et l'adrénaline. Costa Rica, Islande ou safari au Kenya sont faits pour vous." },
};

const QUESTIONS = [
  new Question("Quel rythme de vacances préférez-vous ?", [
    { label: "Farniente total", scores: { plage: 2 } },
    { label: "Marcher et explorer", scores: { montagne: 2, aventure: 1 } },
    { label: "Sorties et culture non-stop", scores: { ville: 2 } },
    { label: "Sensations fortes", scores: { aventure: 2 } },
  ]),
  new Question("Votre paysage idéal ?", [
    { label: "Une plage à perte de vue", scores: { plage: 2 } },
    { label: "Des sommets enneigés", scores: { montagne: 2 } },
    { label: "Une skyline animée", scores: { ville: 2 } },
    { label: "Une jungle ou un désert", scores: { aventure: 2 } },
  ]),
  new Question("Votre bagage indispensable ?", [
    { label: "Maillot de bain", scores: { plage: 2 } },
    { label: "Chaussures de randonnée", scores: { montagne: 2 } },
    { label: "Appareil photo", scores: { ville: 1, aventure: 1 } },
    { label: "Sac à dos léger", scores: { aventure: 2 } },
  ]),
  new Question("Votre repas de voyage préféré ?", [
    { label: "Poisson grillé les pieds dans l'eau", scores: { plage: 2 } },
    { label: "Fondue après une longue marche", scores: { montagne: 2 } },
    { label: "Street food découverte au hasard des rues", scores: { ville: 2, aventure: 1 } },
    { label: "Repas cuisiné autour d'un feu de camp", scores: { aventure: 2 } },
  ]),
];

const root = document.getElementById("quiz-root");
let quiz = new Quiz(QUESTIONS, PROFILES);

export function initQuiz() {
  quiz.reset();
  render();
}

function render() {
  root.innerHTML = "";

  if (quiz.isFinished) {
    renderResult();
    return;
  }

  const question = quiz.currentQuestion;
  const progress = document.createElement("p");
  progress.className = "quiz__progress";
  progress.textContent = `Question ${quiz.currentIndex + 1} / ${quiz.questions.length}`;

  const title = document.createElement("h2");
  title.className = "quiz__question";
  title.textContent = question.prompt;

  const optionsWrap = document.createElement("div");
  optionsWrap.className = "quiz__options";

  question.options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz__option";
    btn.textContent = option.label;
    btn.addEventListener("click", () => {
      quiz.answer(index);
      render();
    });
    optionsWrap.appendChild(btn);
  });

  root.append(progress, title, optionsWrap);
}

function renderResult() {
  const profile = quiz.getResultProfile();

  const wrap = document.createElement("div");
  wrap.className = "quiz__result";
  wrap.innerHTML = `
    <p class="quiz__progress">Résultat</p>
    <p class="quiz__result-badge">${escapeHtml(profile.title)}</p>
    <p>${escapeHtml(profile.description)}</p>
  `;

  const restartBtn = document.createElement("button");
  restartBtn.type = "button";
  restartBtn.className = "btn btn--primary";
  restartBtn.textContent = "Refaire le quiz";
  restartBtn.addEventListener("click", () => {
    quiz.reset();
    render();
  });

  wrap.appendChild(restartBtn);
  root.appendChild(wrap);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
