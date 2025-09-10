// js/data.js

// Class names for i18n student naming
export const CLASS_NAMES = {
  Horse: "Horse",
  Falcon: "Falcon",
  "Snow Leopard": "Snow Leopard"
};

// Placeholder student photos
export const STUDENT_PHOTOS = [
  "https://placehold.co/100x100/ADD8E6/000000?text=S1",
  "https://placehold.co/100x100/90EE90/000000?text=S2",
  "https://placehold.co/100x100/FFB6C1/000000?text=S3",
  "https://placehold.co/100x100/FFD700/000000?text=S4",
  "https://placehold.co/100x100/DDA0DD/000000?text=S5",
  "https://placehold.co/100x100/F08080/000000?text=S6",
  "https://placehold.co/100x100/B0C4DE/000000?text=S7",
  "https://placehold.co/100x100/DAA520/000000?text=S8",
  "https://placehold.co/100x100/C0C0C0/000000?text=S9"
];

// Fruit emoji set for password
export const FRUIT_EMOJIS = ["🍎","🍉","🍌","🍓","🍍","🥭","🥝","🍊","🍒"];

// Store items definition
export const storeItems = [
  { id: 'notebook',      name: 'notebook',      icon: '📚', cost: { cognitive: 5 } },
  { id: 'soccer-ball',   name: 'soccerBall',    icon: '⚽', cost: { physical: 7, social: 3 } },
  { id: 'healthy-snack', name: 'healthySnack',  icon: '🍏', cost: { physical: 3 } },
  { id: 'paint-set',     name: 'paintSet',      icon: '🖌️', cost: { creative: 8 } },
  { id: 'board-game',    name: 'boardGame',     icon: '🎲', cost: { social: 6, cognitive: 2 } }
];

// Activities list config
export const learningActivities = [
  { id: 'math-puzzle',       subject: 'Math',    icon: '🔢', titleKey: 'mathPuzzleTitle',        descriptionKey: 'mathPuzzlePrompt' },
  { id: 'reading-time',      subject: 'Reading', icon: '📖', titleKey: 'readingTimeTitle',       descriptionKey: 'squeakyStoryTitle' },
  { id: 'creative-writing',  subject: 'Writing', icon: '✍️', titleKey: 'creativeWritingTitle',   descriptionKey: 'creativeWritingPrompt' },
  { id: 'science-experiment', subject: 'Science', icon: '🔬', titleKey: 'scienceExperimentTitle',  descriptionKey: 'scienceExperimentName' },
  { id: 'memory-challenge',   subject: 'History', icon: '🧠', titleKey: 'memoryChallengeTitle',    descriptionKey: 'memoryFactPrompt' },
  { id: 'time-travel-quiz',   subject: 'History', icon: '🗺️', titleKey: 'timeTravelQuizTitle',     descriptionKey: 'timeTravelQuizTitle' }
];

// Puzzle & quiz constants
export const CORRECT_MATH_CODE = "40";
export const READING_CORRECT_ANSWER = "nuts";
export const WORDS_FOR_WRITING = [
  "sparkle","whisper","brave","mystery","journey",
  "ancient","future","silent","giant","tiny",
  "magical","curious","hidden","velvet","echo"
];
export const NUM_WORDS_TO_GENERATE = 5;

// Memory challenge questions
export const MEMORY_CHALLENGE_QUESTIONS = [
  { factKey: "factColumbus",    correctAnswer: "Christopher Columbus", options: ["Isaac Newton","Christopher Columbus","Leonardo da Vinci","Marie Curie"] },
  { factKey: "factShakespeare", correctAnswer: "William Shakespeare",  options: ["William Shakespeare","Jane Austen","Charles Dickens","Mark Twain"] },
  { factKey: "factNapoleon",    correctAnswer: "Napoleon Bonaparte",   options: ["George Washington","Abraham Lincoln","Napoleon Bonaparte","Julius Caesar"] },
  { factKey: "factMLK",         correctAnswer: "Martin Luther King Jr.",options: ["Rosa Parks","Nelson Mandela","Martin Luther King Jr.","Abraham Lincoln"] }
];

// Time-travel quiz questions
export const TIME_TRAVEL_QUIZ_QUESTIONS = [
  { questionKey: "quizQ1", options: ["Romans","Greeks","Egyptians","Vikings"],              correctAnswer: "Egyptians" },
  { questionKey: "quizQ2", options: ["Wood","Mud Bricks","Concrete","Ice Blocks"],          correctAnswer: "Concrete" },
  { questionKey: "quizQ3", options: ["World Cup","Olympics","Gladiator Fights","Chariot Races"], correctAnswer: "Olympics" }
];

// Full translations object
export const translations = {
  en: {
    welcomeTitle: "Welcome to OquWay!",
    chooseClass: "Choose Your Class:",
    horseClass: "Horse Class",
    falconClass: "Falcon Class",
    snowLeopardClass: "Snow Leopard Class",
    pickPhoto: "Pick Your Photo:",
    selectClassPrompt: "Please select your class first to see available photos.",
    enterPassword: "Enter Your 4-Fruit Emoji Password:",
    loginBtn: "Login",
    studentDefaultName: "Student",
    
    selectLocation: "Select Location",
    selectClass: "Select Class",
    selectStudent: "Select Student",
    backBtn: "Back",

    
    dashboardTitle: "My OquWay Dashboard",
    intentionPointsTitle: "My Intention Points:",
    physicalPoints: "Physical",
    cognitivePoints: "Cognitive",
    creativePoints: "Creative",
    socialPoints: "Social",
    earnQuickPointsBtn: "Earn Quick Points",
    goToActivitiesBtn: "Courses",
    logPhysicalActivityBtn: "Log Physical Activity",
    visitStoreBtn: "Visit Store",
    
    storeTitle: "OquWay Intention Store",
    buyBtn: "Buy",
    backToDashboardBtn: "Back to Dashboard",
    
    activitiesTitle: "Courses",
    backToActivitiesBtn: "Back to Courses",
    startActivityBtn: "Start",
    
    notebook: "Notebook",
    soccerBall: "Soccer Ball",
    healthySnack: "Healthy Snack",
    paintSet: "Paint Set",
    boardGame: "Board Game",
    
    mathPuzzleTitle: "Math Puzzle!",
    mathPuzzlePrompt: "Complete the pattern to unlock the secret code:",
    enterCodePrompt: "Enter the 3-digit code:",
    checkCodeBtn: "Check Code",
    mathCorrect: "Correct! You earned 10 cognitive points!",
    mathIncorrect: "Incorrect. Try again!",
    mathCodePlaceholder: "e.g. 123",
    
    readingTimeTitle: "📖 Reading Time",
    squeakyStoryTitle: "The Little Squirrel's Big Adventure",
    squeakyStoryContent:
      "Once upon a time, in a cozy oak tree, lived a tiny squirrel named Squeaky. Squeaky loved nuts more than anything! One crisp autumn morning, he spotted the biggest, shiniest acorn he had ever seen, just across a babbling brook. He knew it would be a challenge to get it, but Squeaky was a brave squirrel. He scampered down his tree, planning his route carefully. \"This will be my greatest treasure!\" he chattered.",
    squeakyQuestion: "Question: What did Squeaky love more than anything?",
    applesOption: "Apples",
    nutsOption: "Nuts",
    playingOption: "Playing",
    checkAnswerBtn: "Check Answer",
    readingCorrect: "Correct! You earned 10 cognitive points!",
    readingIncorrect: "Incorrect. Keep trying!",
    readingNoSelection: "Please select an answer!",
    
    creativeWritingTitle: "✍️ Creative Writing",
    creativeWritingPrompt: "Write a short story (at least 3 sentences) using these 5 words:",
    finishWritingBtn: "Finish Writing",
    writingTooShort: "Please write a bit more to complete your story!",
    writingSuccess: "Wonderful story! You earned 15 creative points!",
    creativeWritingPlaceholder: "Start your amazing story here...",
    
    scienceExperimentTitle: "🔬 Science Experiment",
    scienceExperimentName: "Experiment: Baking Soda & Vinegar Volcano! 🌋",
    scienceExperimentDesc:
      "Imagine you have a small bottle. You add two spoonfuls of baking soda inside. Then, you slowly pour in some vinegar. What do you think will happen?",
    yourObservation: "Your Observation:",
    submitObservationBtn: "Submit Observation",
    observationTooShort: "Please write a bit more about your observation!",
    observationSuccess: "Excellent observation! You earned 10 cognitive points!",
    observationPlaceholder: "Describe what you think happens...",
    
    memoryChallengeTitle: "🧠 Memory Challenge",
    memoryFactPrompt: "Match the historical fact to the famous person:",
    nextChallengeBtn: "Next Challenge",
    memoryCorrect: "Correct!",
    memoryIncorrect: "Incorrect, but keep learning!",
    memoryAllDone: "You've completed all memory challenges! You earned 20 cognitive points!",
    
    timeTravelQuizTitle: "🗺️ Time Travel Quiz",
    nextQuestionBtn: "Next Question",
    finishQuizBtn: "Finish Quiz",
    quizNoSelection: "Please select an answer!",
    quizCorrect: "Correct!",
    quizIncorrect: (ans) => `Incorrect. The answer was ${ans}.`,
    quizComplete: (scr, tot) =>
      `Quiz complete! You scored ${scr} out of ${tot}! You earned ${scr * 5} cognitive points!`,
    quizQuestionOf: (cur, tot) => `Question ${cur} of ${tot}`,
    
    loginSuccess: "Login successful! Welcome to your dashboard!",
    loginSelectClass: "Please select your class!",
    loginSelectPhoto: "Please select your photo!",
    loginEnterPassword: "Please enter 4 fruits for your password!",
    pointsEarned: (pts, tp) => `You earned ${pts} ${tp} points!`,
    physicalActivityLogged: (pts) =>
      `You logged physical activity and earned ${pts} physical points!`,
    purchaseSuccess: (item) => `You purchased the ${item}!`,
    notEnoughPoints: (item) => `Not enough points for ${item}!`,
    startingActivity: (title) => `Starting activity: ${title}`,
    fruitPasswordPlaceholder: "Enter 4 fruits",
    
    selectYourPhoto: "Select Your Photo",
    loginBtnLabel: "Login",      
    loadingStudents: "Loading students…",
    loadingClasses: "Loading classes…",
    courseModules: "Course Modules",
    
  },
  // **********************
  // *** END OF ENGLISH ***
  // **********************
  ru: {
    welcomeTitle: "Добро пожаловать в OquWay!",
    chooseClass: "Выберите свой класс:",
    horseClass: "Класс Лошади",
    falconClass: "Класс Сокола",
    snowLeopardClass: "Класс Снежного Барса",
    pickPhoto: "Выберите свою фотографию:",
    selectClassPrompt:
      "Пожалуйста, сначала выберите свой класс, чтобы увидеть доступные фотографии.",
    enterPassword: "Введите пароль из 4 фруктов:",
    loginBtn: "Войти",
    studentDefaultName: "Ученик",
    
    selectLocation: "Выберите местоположение",
    selectClass: "Выберите класс",
    selectStudent: "Выберите ученика",
    backBtn: "Назад",

    
    dashboardTitle: "Моя панель OquWay",
    intentionPointsTitle: "Мои баллы намерения:",
    physicalPoints: "Физические",
    cognitivePoints: "Когнитивные",
    creativePoints: "Творческие",
    socialPoints: "Социальные",
    earnQuickPointsBtn: "Набрать быстрые баллы",
    goToActivitiesBtn: "Курсы",
    logPhysicalActivityBtn: "Зарегистрировать физ. активность",
    visitStoreBtn: "Посетить магазин",
    
    storeTitle: "Магазин намерения OquWay",
    buyBtn: "Купить",
    backToDashboardBtn: "Вернуться на панель",
    
    activitiesTitle: "Курсы",
    backToActivitiesBtn: "Назад к курсам",
    startActivityBtn: "Начать",
    
    notebook: "Тетрадь",
    soccerBall: "Футбольный мяч",
    healthySnack: "Здоровый перекус",
    paintSet: "Набор для рисования",
    boardGame: "Настольная игра",
    
    mathPuzzleTitle: "Математическая головоломка!",
    mathPuzzlePrompt:
      "Завершите шаблон, чтобы разблокировать секретный код:",
    enterCodePrompt: "Введите 3-значный код:",
    checkCodeBtn: "Проверить код",
    mathCorrect: "Верно! Вы получили 10 когнитивных баллов!",
    mathIncorrect: "Неверно. Попробуйте снова!",
    mathCodePlaceholder: "напр. 123",
    
    readingTimeTitle: "📖 Время чтения",
    squeakyStoryTitle: "Большое приключение маленькой белки",
    squeakyStoryContent:
      "Давным-давно, на уютном дубе, жила крошечная белка по имени Сквики. Сквики любил орехи больше всего на свете! Одним свежим осенним утром он заметил самый большой и блестящий желудь, который когда-либо видел, прямо через журчащий ручей. Он знал, что добраться до него будет непросто, но Сквики был храброй белкой. Он быстро спустился со своего дерева, тщательно планируя свой маршрут. «Это будет мое величайшее сокровище!» - проболтал он.",
    squeakyQuestion: "Вопрос: Что Сквики любил больше всего на свете?",
    applesOption: "Яблоки",
    nutsOption: "Орехи",
    playingOption: "Игры",
    checkAnswerBtn: "Проверить ответ",
    readingCorrect: "Верно! Вы получили 10 когнитивных баллов!",
    readingIncorrect: "Неверно. Продолжайте попытки!",
    readingNoSelection: "Пожалуйста, выберите ответ!",
    
    creativeWritingTitle: "✍️ Творческое письмо",
    creativeWritingPrompt:
      "Напишите короткий рассказ (минимум 3 предложения), используя эти 5 слов:",  
    finishWritingBtn: "Завершить написание",  
    writingTooShort:  
      "Пожалуйста, напишите еще немного, чтобы завершить свой рассказ!",  
    writingSuccess:  
      "Замечательная история! Вы получили 15 творческих баллов!",  
    creativeWritingPlaceholder:  
      "Начните свою удивительную историю здесь...",  
    
    scienceExperimentTitle: "🔬 Научный эксперимент",
    scienceExperimentName:  
      "Эксперимент: Вулкан из пищевой соды и уксуса! 🌋",  
    scienceExperimentDesc:  
      "Представьте, что у вас есть маленькая бутылка. Вы добавляете в нее две ложки пищевой соды. Затем вы медленно наливаете немного уксуса. Как вы думаете, что произойдет?",  
    yourObservation: "Ваше наблюдение:",  
    submitObservationBtn: "Отправить наблюдение",  
    observationTooShort:  
      "Пожалуйста, напишите немного больше о своем наблюдении!",  
    observationSuccess:  
      "Отличное наблюдение! Вы получили 10 когнитивных баллов!",  
    observationPlaceholder:  
      "Опишите, что, по вашему мнению, происходит...",  
    
    memoryChallengeTitle: "🧠 Испытание памяти",
    memoryFactPrompt:  
      "Сопоставьте исторический факт с известной личностью:",  
    nextChallengeBtn: "Следующее задание",  
    memoryCorrect: "Верно!",  
    memoryIncorrect: "Неверно, но продолжайте учиться!",  
    memoryAllDone:  
      "Вы выполнили все задания на память! Вы получили 20 когнитивных баллов!",  
    
    timeTravelQuizTitle: "🗺️ Виртуальная викторина",
    nextQuestionBtn: "Следующий вопрос",
    finishQuizBtn: "Завершить викторину",
    quizNoSelection: "Пожалуйста, выберите ответ!",
    quizCorrect: "Верно!",
    quizIncorrect: (ans) => `Неверно. Ответ был ${ans}.`,
    quizComplete: (scr, tot) =>
      `Викторина завершена! Вы набрали ${scr} из ${tot}! Вы заработали ${scr * 5} когнитивных баллов!`,
    quizQuestionOf: (cur, tot) => `Вопрос ${cur} из ${tot}`,
    
    loginSuccess:  
      "Вход успешен! Добро пожаловать на панель управления!",
    loginSelectClass: "Пожалуйста, выберите свой класс!",
    loginSelectPhoto: "Пожалуйста, выберите свою фотографию!",
    loginEnterPassword:  
      "Пожалуйста, введите 4 фрукта для вашего пароля!",
    pointsEarned: (pts, tp) => `Вы заработали ${pts} ${tp} баллов!`,
    physicalActivityLogged: (pts) =>  
      `Вы зарегистрировали физическую активность и заработали ${pts} физических баллов!`,
    purchaseSuccess: (item) => `Вы купили ${item}!`,
    notEnoughPoints: (item) => `Недостаточно баллов для ${item}!`,
    startingActivity: (title) => `Запуск активности: ${title}`,
    fruitPasswordPlaceholder: "Введите 4 фрукта",
    selectYourPhoto: "Выберите свою фотографию",
    loginBtnLabel: "Войти",
    loadingStudents: "Загрузка учеников…",
    loadingClasses: "Загрузка классов…",
    courseModules: "Модули курса",
  },
  // **********************
  // *** END OF RUSSIAN ***
  // **********************
  kg: {
    welcomeTitle: "OquWay'га кош келиңиз!",
    chooseClass: "Классыңызды тандаңыз:",
    horseClass: "Жылкы классы",
    falconClass: "Шумкар классы",
    snowLeopardClass: "Илбирс классы",
    pickPhoto: "Сүрөтүңüzдү тандаңыз:",
    selectClassPrompt:
      "Сураныч, жеткиликтүү сүрөттөрдү көрүү үчүн адегенде классыңызды тандаңыз.",
    enterPassword: "4-мөмө эмодзи паролуңузду киргизиңиз:",
    loginBtn: "Кирүү",
    studentDefaultName: "Окуучу",
    
    selectLocation: "Жайгашкан жерди тандаңыз",
    selectClass: "Классты тандаңыз",
    selectStudent: "Окуучуну тандаңыз",
    backBtn: "Артка",


    dashboardTitle: "Менин OquWay тактам",
    intentionPointsTitle: "Менин ниет упайларым:",
    physicalPoints: "Физикалык",
    cognitivePoints: "Таанып-билүүчүлүк",
    creativePoints: "Чыгармачыл",
    socialPoints: "Социалдык",
    earnQuickPointsBtn: "Тез упай топтоо",
    goToActivitiesBtn: "Курстар",
    logPhysicalActivityBtn: "Физикалык активдүүлүктү каттоо",
    visitStoreBtn: "Дүкөнгө баруу",

    storeTitle: "OquWay ниет дүкөнү",
    buyBtn: "Сатып алуу",
    backToDashboardBtn: "Башкы бетке кайтуу",

    activitiesTitle: "Курстар",
    backToActivitiesBtn: "Курстарга кайтуу",
    startActivityBtn: "Баштоо",

    notebook: "Дәптер",
    soccerBall: "Футбол тобу",
    healthySnack: "Пайдалуу тамак",
    paintSet: "Боёк топтому",
    boardGame: "Үстөл оюну",

    mathPuzzleTitle: "Мatemатикалык табышмак!",
    mathPuzzlePrompt:
      "Жашыруун кодду ачуу үчүн үлгүнү толуктаңыз:",
    enterCodePrompt: "3 орундуу кодду киргизиңиз:",
    checkCodeBtn: "Кодду текшерүү",
    mathCorrect: "Туура! Сиз 10 когнитивдик упай алдыңыз!",
    mathIncorrect: "Туура эмес. Кайра аракет кылыңыз!",
    mathCodePlaceholder: "мис. 123",

    readingTimeTitle: "📖 Окуу убактысы",
    squeakyStoryTitle: "Кичинекей тайгандын чоң жоруктары",
    squeakyStoryContent:
      "Бир заманда, жайлуу эмен дарагында, Сквики аттуу кичинекей тайган жашаган. Сквики жаңгакты баарынан да жакшы көрчү! Бир салкын күзгү таңда, ал шаркыраган агын суунун аркы өйүзүндөгү эң чоң, эң жалтырак жаңгакты көрдү. Ал ага жетүү кыйын болорун билген, бирок Сквики эр жүрөк тайган болчу. Ал дарагынан ылдый түшүп, жолун кылдат пландаштырды. «Бул менин эң чоң кенчим болот!» - деп шыбырады ал.",
    squeakyQuestion:
      "Суроо: Сквики баарынан да эмнени жакшы көрчү?",
    applesOption: "Алма",
    nutsOption: "Жаңгак",
    playingOption: "Ойноо",
    checkAnswerBtn: "Жоопту текшерүү",
    readingCorrect: "Туура! Сиз 10 когнитивдик упай алдыңыз!",
    readingIncorrect: "Туура эмес. Аракет кыла бериңиз!",
    readingNoSelection: "Сураныч, жоопту тандаңыз!",

    creativeWritingTitle: "✍️ Чыгармачыл жазуу",
    creativeWritingPrompt:
      "Бул 5 сөздү колдонуп, кыска аңгеме жазыңыз (кеминде 3 сүйлөм):",
    finishWritingBtn: "Жазууну бүтүрүү",
    writingTooShort:
      "Сураныч, аңгемеңизди толуктоо үчүн дагы бир аз жазыңыз!",
    writingSuccess: "Керемет аңгеме! Сиз 15 чыгармачыл упай алдыңız!",
    creativeWritingPlaceholder:
      "Керемет аңгемеңизди бул жерден баштаңыз...",

    scienceExperimentTitle: "🔬 Илим эксперименти",
    scienceExperimentName:
      "Эксперимент: Аш sodасы and yyкcus жанар тоосу! 🌋",
    scienceExperimentDesc:
      "Кичинекей бөтөлкөңүз бар деп элестетиңиз. Ага екі кашык аш sodasını саласыз. Андан кийин, жайлап бір аз ыксус куясыз. Эмне болот деп ойлойсуз?",
    yourObservation: "Сиздин байкооңуз:",
    submitObservationBtn: "Байкоону tapшыруу",
    observationTooShort:
      "Сураныч, байкооңуз жөнүндө дагы бир аз жазыңыз!",
    observationSuccess:
      "Мықты байкоо! Сиз 10 когнитивдик упай алдыңız!",
    observationPlaceholder:
      "Эмне болот деп ойлойсуз, сүрөттөп бериңиз...",  

    memoryChallengeTitle: "🧠 Эc тутум сыноосу",
    memoryFactPrompt:
      "Тарыхый фактыны атактуу адамга дал келтириңиз:",
    nextChallengeBtn: "Кiyинки сыноо",
    memoryCorrect: "Tуура!",
    memoryIncorrect: "Tуура эмес, бирок үйрөнө бериңиз!",
    memoryAllDone:
      "Сиз бардык эc тутум сыноолорун аяктадыңız! Сиз 20 когнитивдик упай alдыңız!",  

    timeTravelQuizTitle: "🗺️ Убакыт саякат викторинасы",
    nextQuestionBtn: "Kiynки суроо",
    finishQuizBtn: "Викторинаны бүтүрүү",
    quizNoSelection: "Сураныч, жоопту тандаңыз!",
    quizCorrect: "Tуура!",
    quizIncorrect: (ans) => `Tуура эмес. Жооп ${ans} болгon.`,
    quizComplete: (vot,tot) =>
      `Викторина бүттү! Сиз ${vot} ичинен ${tot} упай aldдınız! Сиз ${vot *5} когнитивдик упай alдыңız!`,
    quizQuestionOf: (ku,tu) => `${ku} суроо ${tu} ичинен`,  
    
    loginSuccess:
      "Kирүү ийгиликтүү! Башкы такtaңызга кош kелниiz!",
    loginSelectClass: "Сураныч, классыңызды тандаңыз!",
    loginSelectPhoto: "Сураныч, сүрөтүңүздү тандаңыз!",
    loginEnterPassword:
      "Сураныч, паролуңuz үчүн 4 мөмө киргизиңiz!",
    pointsEarned: (bty,tp) => `Сiz ${bty} ${tp} upай aldңыз!`,
    physicalActivityLogged: (bty) =>
      `Сiz физикалык активдүүлүктү каттадыңız жана ${bty} физикалык упай aldдыңız!`,
    purchaseSuccess: (i) => `Сiz ${i} сатып алдыңız!`,
    notEnoughPoints: (i) => `Упай жетишсиз: ${i}!`,
    startingActivity: (t) => `Иsh-чара башталууда: ${t}`,
    fruitPasswordPlaceholder: "4 мөмө киргизиңiz",
    selectYourPhoto: "Сүрөтүңүздү тандаңыз",
    loginBtnLabel: "Кирүү",
    loadingStudents: "Окуучулар жүктөлүүдө…",
    loadingClasses: "Класстар жүктөлүүдө…",
    courseModules: "Курс модулдары",
  }
};
