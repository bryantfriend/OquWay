// js/config.js

export let studentData = {
  name: "Student",
  selectedClass: null,
  avatar: null,
  points: { physical: 50, cognitive: 50, creative: 50, social: 50 },
  currentLang: "en"
};

export const CLASS_NAMES = {
  Horse: "Horse",
  Falcon: "Falcon",
  "Snow Leopard": "Snow Leopard"
};

export const STUDENT_PHOTOS = [
  /* your image URLs here */
];

export const FRUIT_EMOJIS = ["🍎", "🍉", "🍌", "🍓", "🍍", "🥭", "🥝", "🍊", "🍒"];

export const storeItems = [
  /* your item definitions here */
];

// js/config.js
export const learningActivities = [
  {
    id: 'math-puzzle',
    file: 'mathPuzzle.js',
    subject: 'Math',
    icon: '🔢',
    titleKey: 'mathPuzzleTitle',
    descriptionKey: 'mathPuzzlePrompt'
  },
  {
    id: 'reading-time',
    file: 'readingTime.js',
    subject: 'Reading',
    icon: '📖',
    titleKey: 'readingTimeTitle',
    descriptionKey: 'squeakyStoryTitle'
  },
  {
    id: 'creative-writing',
    file: 'creativeWriting.js',
    subject: 'Writing',
    icon: '✍️',
    titleKey: 'creativeWritingTitle',
    descriptionKey: 'creativeWritingPrompt'
  },
  {
    id: 'science-experiment',
    file: 'scienceExperiment.js',
    subject: 'Science',
    icon: '🔬',
    titleKey: 'scienceExperimentTitle',
    descriptionKey: 'scienceExperimentName'
  },
  {
    id: 'memory-challenge',
    file: 'memoryChallenge.js',
    subject: 'History',
    icon: '🧠',
    titleKey: 'memoryChallengeTitle',
    descriptionKey: 'memoryFactPrompt'
  },
  {
    id: 'time-travel-quiz',
    file: 'timeTravelQuiz.js',
    subject: 'History',
    icon: '🗺️',
    titleKey: 'timeTravelQuizTitle',
    descriptionKey: 'timeTravelQuizTitle'
  }
  
  
];

