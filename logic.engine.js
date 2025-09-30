const QUESTION_PATTERNS = {
  PRAGMATIC: 'pragmatic_application',
  LOGICAL: 'logical_reasoning', 
  CANON: 'canon_administrative',
  STATISTICAL: 'statistical_predictive',
  MATHEMATICAL: 'pure_mathematical'
};

const INFORMATION_TYPES = {
  ESSENTIAL: 'essential',
  CONTEXTUAL: 'contextual_historical', 
  ABSTRACT: 'abstract_visual',
  SUPPLY_CHAIN: 'supply_chain_product',
  MATH_PROOFS: 'maths_proofs_formulas'
};

class AdaptiveQuizEngine {
  constructor() {
    this.questions = [];
    this.userProfile = this.initializeUserProfile();
    this.currentQuiz = null;
  }

  initializeUserProfile() {
    const patternMastery = {};
    const informationMastery = {};
    
    Object.values(QUESTION_PATTERNS).forEach(pattern => {
      patternMastery[pattern] = { attempts: 0, correct: 0, confidence: 0.5 };
    });

    Object.values(INFORMATION_TYPES).forEach(type => {
      informationMastery[type] = { attempts: 0, correct: 0, confidence: 0.5 };
    });

    return {
      patternMastery,
      informationMastery,
      currentDifficultyLevel: 0.5,
      totalQuestions: 0,
      totalCorrect: 0
    };
  }

  async loadQuestions(subject) {
    this.questions = this.generateDemoQuestions(subject);
    return this.questions;
  }

  generateDemoQuestions(subject) {
    const questions = [];
    const patterns = Object.values(QUESTION_PATTERNS);
    const infoTypes = Object.values(INFORMATION_TYPES);
    
    const questionTemplates = {
      mathematics: [
        "Solve for x: 2x + 5 = 15",
        "Calculate the area of a circle with radius 7",
        "Simplify the expression: 3(x + 4) - 2x",
        "Find the derivative of f(x) = x² + 3x",
        "Solve the quadratic equation: x² - 5x + 6 = 0"
      ],
      physics: [
        "Calculate the force needed to accelerate a 5kg object at 3m/s²",
        "A car travels 150km in 2 hours. What is its average speed?",
        "What is the kinetic energy of a 2kg object moving at 4m/s?",
        "Calculate the work done by a 20N force moving an object 5m",
        "What is the power output if 100J of work is done in 5 seconds?"
      ],
      english: [
        "Choose the correct sentence structure",
        "Identify the grammatical error in the sentence",
        "Select the appropriate word for the context",
        "Which sentence uses correct punctuation?",
        "Identify the subject in the given sentence"
      ]
    };

    const templates = questionTemplates[subject] || questionTemplates.mathematics;
    
    for (let i = 0; i < 20; i++) {
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      const infoType = infoTypes[Math.floor(Math.random() * infoTypes.length)];
      const difficulty = 0.3 + Math.random() * 0.6;
      
      questions.push({
        id: `${subject}_q${i + 1}`,
        text: templates[i % templates.length],
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct: Math.floor(Math.random() * 4),
        explanation: `This question tests ${pattern.replace('_', ' ')} and ${infoType.replace('_', ' ')}`,
        topic: subject,
        difficulty: difficulty,
        
        _cognitive: {
          pattern: pattern,
          complexity: difficulty
        },
        _information: {
          type: infoType,
          priority: 0.5 + Math.random() * 0.5
        }
      });
    }
    
    return questions;
  }

  startQuiz(stakeLevel, questionCount = 10) {
    this.currentQuiz = {
      stakeLevel,
      answeredQuestions: [],
      currentQuestion: null,
      startTime: Date.now(),
      questionCount,
      currentQuestionIndex: 0
    };
    
    return this.getNextQuestion();
  }

  getNextQuestion() {
    if (!this.currentQuiz) return null;
    
    const answeredIds = this.currentQuiz.answeredQuestions.map(q => q.question.id);
    const available = this.questions.filter(q => !answeredIds.includes(q.id));
    
    if (available.length === 0 || this.currentQuiz.currentQuestionIndex >= this.currentQuiz.questionCount) {
      return null;
    }

    const weakPatterns = this.identifyWeakPatterns();
    const weakInfoTypes = this.identifyWeakInformationTypes();
    
    const scored = available.map(q => {
      let score = 1.0;
      if (weakPatterns.includes(q._cognitive.pattern)) score += 2.0;
      if (weakInfoTypes.includes(q._information.type)) score += 1.5;
      
      const diffMatch = 1 - Math.abs(q._cognitive.complexity - this.userProfile.currentDifficultyLevel);
      score += diffMatch * 1.5;
      
      return { question: q, score };
    });
    
    const totalScore = scored.reduce((sum, item) => sum + item.score, 0);
    let random = Math.random() * totalScore;
    
    for (const item of scored) {
      random -= item.score;
      if (random <= 0) return item.question;
    }
    
    return available[0];
  }

  identifyWeakPatterns() {
    return Object.entries(this.userProfile.patternMastery)
      .filter(([_, mastery]) => mastery.attempts > 0 && mastery.confidence < 0.6)
      .map(([pattern, _]) => pattern);
  }

  identifyWeakInformationTypes() {
    return Object.entries(this.userProfile.informationMastery)
      .filter(([_, mastery]) => mastery.attempts > 0 && mastery.confidence < 0.6)
      .map(([type, _]) => type);
  }

  answerQuestion(selectedOption) {
    if (!this.currentQuiz?.currentQuestion) return null;
    
    const question = this.currentQuiz.currentQuestion;
    const isCorrect = selectedOption === question.correct;
    const responseTime = (Date.now() - this.currentQuiz.questionStartTime) / 1000;
    
    const answerData = {
      question,
      selectedOption,
      isCorrect,
      responseTime,
      timestamp: Date.now()
    };
    
    this.currentQuiz.answeredQuestions.push(answerData);
    this.updateUserProfile(isCorrect, responseTime);
    
    return answerData;
  }

  updateUserProfile(wasCorrect, responseTime) {
    const question = this.currentQuiz.currentQuestion;
    const pattern = question._cognitive.pattern;
    const infoType = question._information.type;
    
    this.updateMastery(this.userProfile.patternMastery[pattern], wasCorrect, responseTime);
    this.updateMastery(this.userProfile.informationMastery[infoType], wasCorrect, responseTime);
    
    this.userProfile.totalQuestions++;
    if (wasCorrect) {
      this.userProfile.totalCorrect++;
      this.userProfile.currentDifficultyLevel = Math.min(1.0, 
        this.userProfile.currentDifficultyLevel + 0.05);
    } else {
      this.userProfile.currentDifficultyLevel = Math.max(0.1,
        this.userProfile.currentDifficultyLevel - 0.1);
    }
  }

  updateMastery(masteryObj, wasCorrect, responseTime) {
    masteryObj.attempts++;
    if (wasCorrect) masteryObj.correct++;
    masteryObj.confidence = masteryObj.correct / masteryObj.attempts;
  }

  getResults() {
    if (!this.currentQuiz) return null;
    
    const answered = this.currentQuiz.answeredQuestions;
    const correctCount = answered.filter(a => a.isCorrect).length;
    const totalTime = (Date.now() - this.currentQuiz.startTime) / 1000;
    
    return {
      totalQuestions: answered.length,
      correctCount,
      score: (correctCount / answered.length) * 100,
      totalTime,
      performanceByPattern: this.calculatePatternPerformance(),
      performanceByInformation: this.calculateInformationPerformance()
    };
  }

  calculatePatternPerformance() {
    const performance = {};
    Object.values(QUESTION_PATTERNS).forEach(pattern => {
      const patternAnswers = this.currentQuiz.answeredQuestions
        .filter(a => a.question._cognitive.pattern === pattern);
      
      if (patternAnswers.length > 0) {
        const correct = patternAnswers.filter(a => a.isCorrect).length;
        performance[pattern] = {
          total: patternAnswers.length,
          correct,
          percentage: (correct / patternAnswers.length) * 100
        };
      }
    });
    return performance;
  }

  calculateInformationPerformance() {
    const performance = {};
    Object.values(INFORMATION_TYPES).forEach(type => {
      const typeAnswers = this.currentQuiz.answeredQuestions
        .filter(a => a.question._information.type === type);
      
      if (typeAnswers.length > 0) {
        const correct = typeAnswers.filter(a => a.isCorrect).length;
        performance[type] = {
          total: typeAnswers.length,
          correct,
          percentage: (correct / typeAnswers.length) * 100
        };
      }
    });
    return performance;
  }
}