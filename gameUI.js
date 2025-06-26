// gameUI.js
const gameUI = {
    quitGame: function() {
        console.log('Quitting game and resetting state...');
        
        // Reset game state completely
        gameState.resetLevel();
        gameState.clearSeenQuestions(); // Clear any tracked questions
        
        // Reset UI elements
        const questionBox = document.getElementById('questionBox');
        const answersDiv = document.getElementById('answers');
        const feedback = document.getElementById('feedback');
        const progressDisplay = document.getElementById('progress');
        const introOverlay = document.getElementById('introOverlay');
        const mainContent = document.getElementById('mainContent');
        const levelSelect = document.querySelector('.level-select');
        const introSequence = document.querySelector('.intro-sequence');

        if (questionBox) questionBox.innerText = 'Loading question...';
        if (answersDiv) answersDiv.innerHTML = '';
        if (feedback) feedback.innerText = '';
        if (progressDisplay) progressDisplay.innerText = '';

        // Show intro overlay and level select, hide main content
        if (introOverlay && mainContent && levelSelect && introSequence) {
            mainContent.style.display = 'none';
            introOverlay.style.display = 'flex';
            introSequence.style.display = 'none';
            levelSelect.style.display = 'flex';
            levelSelect.style.opacity = '1';
            introOverlay.style.opacity = '1';

            // Update level buttons
            if (typeof updateLevelButtons === 'function') {
                updateLevelButtons();
            }
        } else {
            console.error('Could not find required elements:', { introOverlay, mainContent, levelSelect, introSequence });
        }

        // Remove quit button
        this.hideQuitButton();
    },

    createQuitButton: function() {
        if (document.getElementById('quitButton')) return; // Don't create if already exists
        
        const quitButton = document.createElement('button');
        quitButton.id = 'quitButton';
        quitButton.textContent = 'Quit to Levels';
        quitButton.className = 'quit-button';
        quitButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            background: #ff4757;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
            transition: background 0.3s ease;
        `;
        
        quitButton.addEventListener('mouseenter', () => {
            quitButton.style.background = '#ff3742';
        });
        
        quitButton.addEventListener('mouseleave', () => {
            quitButton.style.background = '#ff4757';
        });
        
        quitButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to quit and return to level selection?')) {
                this.quitGame();
            }
        });
        
        document.body.appendChild(quitButton);
    },

    showQuitButton: function() {
        this.createQuitButton();
        const quitButton = document.getElementById('quitButton');
        if (quitButton) {
            quitButton.style.display = 'block';
        }
    },

    hideQuitButton: function() {
        const quitButton = document.getElementById('quitButton');
        if (quitButton) {
            quitButton.style.display = 'none';
        }
    },

    returnToLevels: function() {
        // Your existing returnToLevels implementation
        console.log('Returning to levels...');
        gameState.resetLevel();
        // Add your existing code here
    }
};

// Enhanced game state management
const gameState = {
    currentLevel: 1,
    currentQuestionIndex: 0,
    currentQuestions: null,
    seenQuestions: new Set(), // Track questions that have been seen
    progress: JSON.parse(localStorage.getItem('mathSafariProgress')) || {
        1: { completed: 0, unlocked: true },
        2: { completed: 0, unlocked: false },
        // ... other levels ...
        20: { completed: 0, unlocked: false }
    },

    resetLevel: function() {
        console.log('Resetting level state...');
        this.currentQuestionIndex = 0;
        this.currentQuestions = null;
        // reset currentLevel here - let it be set by level selection
    },

    clearSeenQuestions: function() {
        console.log('Clearing seen questions...');
        this.seenQuestions.clear();
    },

    loadQuestionsForLevel: function(level) {
        console.log(`Loading questions for level ${level}...`);
        this.currentLevel = level;
        this.currentQuestionIndex = 0;
        
        // Make sure we have the levels data
        if (typeof levels === 'undefined' || !levels[level]) {
            console.error(`Level ${level} not found in levels data`);
            return false;
        }

        // Get all questions for THIS specific level
        const allQuestions = [...levels[level].questions];
        
        if (allQuestions.length === 0) {
            console.error(`No questions found for level ${level}`);
            return false;
        }

        // Create a fresh shuffled copy for this specific level
        this.currentQuestions = this.getShuffledUniqueQuestions(allQuestions);
        
        console.log(`Successfully loaded ${this.currentQuestions.length} questions for level ${level}`);
        console.log(`First question: ${this.currentQuestions[0]?.q}`);
        return true;
    },

    getShuffledUniqueQuestions: function(questions) {
        // Create a copy and shuffle it
        let shuffled = [...questions];
        this.shuffleArray(shuffled);
        
        // If we have seen questions, try to prioritize unseen ones
        if (this.seenQuestions.size > 0) {
            const unseen = shuffled.filter(q => !this.seenQuestions.has(this.getQuestionId(q)));
            const seen = shuffled.filter(q => this.seenQuestions.has(this.getQuestionId(q)));
            
            // If we have unseen questions, put them first
            if (unseen.length > 0) {
                shuffled = [...unseen, ...seen];
                console.log(`Prioritized ${unseen.length} unseen questions`);
            }
        }
        
        return shuffled;
    },

    getQuestionId: function(question) {
        // Create a unique ID for each question based on its content
        return `${question.q}_${question.a}`;
    },

    markQuestionAsSeen: function(question) {
        const id = this.getQuestionId(question);
        this.seenQuestions.add(id);
        console.log(`Marked question as seen: ${id}`);
    },

    shuffleArray: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    getCurrentQuestion: function() {
        if (!this.currentQuestions || this.currentQuestionIndex >= this.currentQuestions.length) {
            return null;
        }
        
        const question = this.currentQuestions[this.currentQuestionIndex];
        
        // Mark this question as seen when it's displayed
        this.markQuestionAsSeen(question);
        
        return question;
    },

    moveToNextQuestion: function() {
        this.currentQuestionIndex++;
        return this.currentQuestionIndex < this.currentQuestions.length;
    },

    isLevelComplete: function() {
        return this.currentQuestionIndex >= this.currentQuestions.length;
    },

    saveProgress: function() {
        localStorage.setItem('mathSafariProgress', JSON.stringify(this.progress));
        console.log('Progress saved');
    }
};

// Enhanced question display function
function showQuestion() {
    const question = gameState.getCurrentQuestion();
    
    if (!question) {
        console.error('No question available');
        return;
    }

    // Show the quit button when a question is displayed
    gameUI.showQuitButton();

    const questionBox = document.getElementById('questionBox');
    const answersDiv = document.getElementById('answers');
    const progressDisplay = document.getElementById('progress');

    if (questionBox) questionBox.innerText = question.q;
    if (answersDiv) answersDiv.innerHTML = '';
    
    if (progressDisplay) {
        const current = gameState.currentQuestionIndex + 1;
        const total = gameState.currentQuestions.length;
        progressDisplay.innerText = `Question ${current} of ${total}`;
    }

    // Create answer buttons
    if (answersDiv && question.options) {
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'answer-btn';
            button.addEventListener('click', () => checkAnswer(option));
            answersDiv.appendChild(button);
        });
    }
}

// Enhanced answer checking
function checkAnswer(selectedAnswer) {
    const question = gameState.getCurrentQuestion();
    if (!question) return;

    const feedback = document.getElementById('feedback');
    const isCorrect = selectedAnswer === question.a;

    if (feedback) {
        feedback.innerText = isCorrect ? 'Correct!' : `Wrong! The answer is ${question.a}`;
        feedback.className = isCorrect ? 'correct' : 'wrong';
    }

    // Disable answer buttons
    const answerButtons = document.querySelectorAll('.answer-btn');
    answerButtons.forEach(btn => btn.disabled = true);

    setTimeout(() => {
        if (gameState.moveToNextQuestion()) {
            showQuestion();
        } else {
            handleLevelCompletion();
        }
    }, 1500);
}

function handleLevelCompletion() {
    console.log('Level completed!');
    
    // Hide quit button on completion
    gameUI.hideQuitButton();
    
    // Update progress
    const level = gameState.currentLevel;
    if (gameState.progress[level]) {
        gameState.progress[level].completed++;
        
        // Unlock next level if it exists
        if (gameState.progress[level + 1]) {
            gameState.progress[level + 1].unlocked = true;
        }
        
        gameState.saveProgress();
    }

    // Show completion message and return to levels
    const questionBox = document.getElementById('questionBox');
    const answersDiv = document.getElementById('answers');
    const feedback = document.getElementById('feedback');

    if (questionBox) questionBox.innerText = `Level ${level} Complete!`;
    if (answersDiv) answersDiv.innerHTML = '';
    if (feedback) feedback.innerText = 'Great job! Returning to levels...';

    setTimeout(() => {
        gameUI.quitGame(); // This will take them back to level selection
    }, 2000);
}

// Initialize game function
function initGame() {
    console.log('Initializing game...');
    
    // Hide quit button initially
    gameUI.hideQuitButton();
    
    // Set up level selection event listeners
    const levelButtons = document.querySelectorAll('.level-btn');
    levelButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const level = parseInt(e.target.dataset.level);
            if (level && gameState.progress[level] && gameState.progress[level].unlocked) {
                startLevel(level);
            }
        });
    });
}

function startLevel(level) {
    console.log(`Starting level ${level}...`);
    
    // IMPORTANT: Clear any existing questions first
    gameState.currentQuestions = null;
    gameState.currentQuestionIndex = 0;
    
    // Load questions for the selected level
    const success = gameState.loadQuestionsForLevel(level);
    
    if (!success) {
        console.error(`Failed to load level ${level}`);
        alert(`Sorry, couldn't load level ${level}. Please try again.`);
        return;
    }
    
    // Hide intro overlay and show main content
    const introOverlay = document.getElementById('introOverlay');
    const mainContent = document.getElementById('mainContent');
    
    if (introOverlay) introOverlay.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    
    // Show the first question
    showQuestion();
}

function updateLevelButtons() {
    const levelButtons = document.querySelectorAll('.level-btn');
    levelButtons.forEach(button => {
        const level = parseInt(button.dataset.level);
        const levelData = gameState.progress[level];
        
        if (levelData) {
            button.disabled = !levelData.unlocked;
            button.className = levelData.unlocked ? 'level-btn unlocked' : 'level-btn locked';
            
            // Update button text to show completion count
            if (levelData.completed > 0) {
                button.textContent = `Level ${level} (${levelData.completed})`;
            }
        }
    });
}

// Initialize the game when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Make gameUI and gameState available globally
window.gameUI = gameUI;
window.gameState = gameState