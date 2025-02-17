function checkAnswer(questionNumber, correctAnswer) {
    const userAnswer = document.getElementById(`answer${questionNumber}`).value.trim();
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        alert('Correct!');
        document.getElementById(`question${questionNumber}`).style.display = 'none';
        const nextQuestion = document.getElementById(`question${questionNumber + 1}`);
        if (nextQuestion) {
            nextQuestion.style.display = 'block';
        } else {
            document.getElementById('result').style.display = 'block';
        }
    } else {
        alert('Incorrect, please try again.');
    }
}
let startTime;
let playerName = '';
let correctAnswers = 0;
let currentQuestion = 1;

// Add this function to save quiz state
function saveQuizState() {
    localStorage.setItem('quizState', JSON.stringify({
        playerName,
        startTime,
        correctAnswers,
        currentQuestion,
        isQuizStarted: true
    }));
}

// Add this function to load quiz state
function loadQuizState() {
    const savedState = localStorage.getItem('quizState');
    if (savedState) {
        const state = JSON.parse(savedState);
        playerName = state.playerName;
        startTime = state.startTime;
        correctAnswers = state.correctAnswers;
        currentQuestion = state.currentQuestion;

        if (state.isQuizStarted) {
            document.getElementById('nameInput').style.display = 'none';
            document.getElementById('quizSection').style.display = 'block';
            document.querySelector('.corner-button').style.display = 'none';
            
            // Hide all questions except current
            document.querySelectorAll('.question').forEach(question => {
                question.style.display = 'none';
            });
            document.getElementById(`question${currentQuestion}`).style.display = 'block';
            return true;
        }
    }
    return false;
}

// Modify startQuiz function
function startQuiz() {
    playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    startTime = Date.now();
    currentQuestion = 1;
    correctAnswers = 0;
    document.getElementById('nameInput').style.display = 'none';
    document.getElementById('quizSection').style.display = 'block';
    document.querySelector('.corner-button').style.display = 'none';
    saveQuizState();
}

// Modify checkAnswer function
function checkAnswer(questionNumber, correctAnswer) {
    const userAnswer = document.getElementById(`answer${questionNumber}`).value.trim();
    
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
        correctAnswers++;
        document.getElementById(`question${questionNumber}`).style.display = 'none';
        
        if (questionNumber === 5) {
            const endTime = Date.now();
            const completionTime = Math.max(0, Math.floor((endTime - startTime) / 1000));
            document.getElementById('result').style.display = 'block';
            localStorage.removeItem('quizState'); // Clear state on completion
            saveResult(completionTime);
        } else {
            currentQuestion = questionNumber + 1;
            document.getElementById(`question${currentQuestion}`).style.display = 'block';
            saveQuizState();
        }
        return;
    }

    // For partial matches
    let feedback = '';
    let matchedChars = 0;
    
    // If answer is one word, do character matching
    if (!correctAnswer.toLowerCase().includes(' ')) {
        // Count matching characters from the start
        for (let i = 0; i < userAnswer.length && i < correctAnswer.length; i++) {
            if (userAnswer[i] === correctAnswer[i]) {
                matchedChars++;
            } else {
                break; // Stop counting at first mismatch
            }
        }

        if (matchedChars > 0) {
            feedback = `Matched ${matchedChars} character${matchedChars > 1 ? 's' : ''}. `;
            feedback += `${correctAnswer.length - matchedChars} character${correctAnswer.length - matchedChars > 1 ? 's' : ''} remaining.`;
        } else {
            feedback = 'No matching characters. Try again!';
        }

        // Add length hint if lengths don't match
        if (userAnswer.length !== correctAnswer.length) {
            feedback += `\nHint: The answer has ${correctAnswer.length} characters.`;
        }
    } else {
        // For multi-word answers, use the existing word matching logic
        const correctWords = correctAnswer.split(' ');
        const userWords = userAnswer.split(' ');
        let matchedWords = 0;

        userWords.forEach(word => {
            if (correctWords.includes(word)) {
                matchedWords++;
            }
        });

        if (matchedWords > 0) {
            feedback = `You matched ${matchedWords} word${matchedWords > 1 ? 's' : ''} correctly. `;
            feedback += `${correctWords.length - matchedWords} word${correctWords.length - matchedWords > 1 ? 's' : ''} remaining.`;
        } else {
            feedback = 'No matches found. Try again!';
        }

        if (userWords.length !== correctWords.length) {
            feedback += `\nHint: The answer has ${correctWords.length} words.`;
        }
    }

    // Show feedback in a more visible way
    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.color = matchedChars > 0 ? '#ff9800' : '#f44336';
    feedbackDiv.style.marginTop = '10px';
    feedbackDiv.style.padding = '10px';
    feedbackDiv.style.borderRadius = '5px';
    feedbackDiv.style.backgroundColor = '#fff3e0';
    feedbackDiv.textContent = feedback;

    // Remove any existing feedback
    const existingFeedback = document.querySelector(`#question${questionNumber} .feedback`);
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Add new feedback
    feedbackDiv.className = 'feedback';
    document.getElementById(`answer${questionNumber}`).parentNode.appendChild(feedbackDiv);

    // Clear the feedback after 3 seconds
    setTimeout(() => {
        feedbackDiv.remove();
    }, 3000);
}

async function saveResult(completionTime) {
    try {
        console.log('Saving result for:', playerName, 'Score:', correctAnswers, 'Time:', completionTime);
        
        const serverUrl = 'https://logo-design-quizzapp.onrender.com';
        const response = await fetch(`${serverUrl}/api/save-result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://logo-design-quizz-app-fronntend-luse4lksm.vercel.app'
            },
            credentials: 'include',
            body: JSON.stringify({
                name: playerName,
                score: correctAnswers,
                completionTime: completionTime,
                entryTime: startTime
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('result').style.display = 'block';
            // Show the leaderboard button again after quiz completion
            document.querySelector('.corner-button').style.display = 'block';
            await showLeaderboard();
        } else {
            throw new Error(data.error || 'Failed to save results');
        }
    } catch (error) {
        console.error('Error saving results:', error);
        alert('Failed to save results: ' + error.message);
    }
}

// Cache DOM elements
const leaderboardEl = document.getElementById('leaderboard');
const leaderboardBody = document.getElementById('leaderboardBody');
const quizSection = document.getElementById('quizSection');
const nameInput = document.getElementById('nameInput');

// Cache leaderboard data
let cachedLeaderboard = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized leaderboard fetch
async function fetchLeaderboard() {
    const now = Date.now();
    
    // Return cached data if it's fresh
    if (cachedLeaderboard && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedLeaderboard;
    }

    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        cachedLeaderboard = data;
        lastFetchTime = now;
        return data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return cachedLeaderboard || []; // Fallback to cached data or empty array
    }
}

// Optimized leaderboard render
function renderLeaderboard(data) {
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    data.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        // Use template literals for faster string concatenation
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${entry.time}s</td>
            <td>${new Date(entry.date).toLocaleDateString()}</td>
        `;
        
        fragment.appendChild(row);
    });

    // Single DOM update
    leaderboardBody.innerHTML = '';
    leaderboardBody.appendChild(fragment);
}

// Optimized show/hide functions with animations
function showLeaderboard() {
    if (leaderboardEl.style.display === 'none') {
        // Add loading state
        leaderboardEl.classList.add('loading');
        leaderboardEl.style.display = 'block';
        
        // Fetch and render data
        fetchLeaderboard()
            .then(data => {
                renderLeaderboard(data);
                // Remove loading state after render
                requestAnimationFrame(() => {
                    leaderboardEl.classList.remove('loading');
                });
            });
    }
}

// Debounced version for frequent calls
const debouncedShowLeaderboard = debounce(showLeaderboard, 300);

function hideLeaderboard() {
    leaderboardEl.classList.add('fade-out');
    setTimeout(() => {
        leaderboardEl.style.display = 'none';
        leaderboardEl.classList.remove('fade-out');
    }, 300);
}

// Optimized score submission
async function submitScore(name, score, time) {
    try {
        const response = await fetch('/api/submit-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, score, time }),
        });

        if (!response.ok) throw new Error('Score submission failed');

        // Invalidate cache to show new score immediately
        cachedLeaderboard = null;
        
        return true;
    } catch (error) {
        console.error('Error submitting score:', error);
        return false;
    }
}

// Add these CSS classes for smooth transitions
const additionalCSS = `
    #leaderboard {
        transition: opacity 0.3s ease;
    }

    #leaderboard.loading {
        opacity: 0.7;
        pointer-events: none;
    }

    #leaderboard.fade-out {
        opacity: 0;
    }

    .leaderboard-row {
        opacity: 0;
        animation: fadeInRow 0.3s ease forwards;
    }

    @keyframes fadeInRow {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

// Modify the showLeaderboardFromHome function
async function showLeaderboardFromHome() {
    document.getElementById('nameInput').style.display = 'none';
    document.getElementById('quizSection').style.display = 'block';
    // Hide all question divs
    document.querySelectorAll('.question').forEach(question => {
        question.style.display = 'none';
    });
    // Hide the quiz title
    document.querySelector('.quiz-container h2').style.display = 'none';
    await showLeaderboard();
}

// Add window load event listener
window.onload = function() {
    if (!loadQuizState()) {
        // If no saved state, show initial screen
        document.getElementById('nameInput').style.display = 'block';
        document.getElementById('quizSection').style.display = 'none';
        document.querySelector('.corner-button').style.display = 'block';
    }
};

// Add beforeunload event listener to warn before reload
window.addEventListener('beforeunload', function(e) {
    const savedState = localStorage.getItem('quizState');
    if (savedState) {
        e.preventDefault();
        e.returnValue = '';
    }
});