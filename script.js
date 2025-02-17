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

// Constants
const SERVER_URL = 'https://logo-design-quizzapp.onrender.com';
const CACHE_DURATION = 10000; // 10 seconds cache
let cachedLeaderboard = new Map(); // Using Map for faster lookups
let isFetching = false;

// Preload leaderboard data
function preloadLeaderboard() {
    prefetchData();
    // Prefetch every 10 seconds
    setInterval(prefetchData, 10000);
}

// Optimized fetch with AbortController
async function prefetchData() {
    if (isFetching) return;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        isFetching = true;
        const response = await fetch(`${SERVER_URL}/api/leaderboard`, {
            signal: controller.signal,
            method: 'GET',
            headers: {
                'Origin': 'https://logo-design-quizz-app-fronntend-luse4lksm.vercel.app',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            credentials: 'include',
            mode: 'cors',
            priority: 'high'
        });

        const data = await response.json();
        cachedLeaderboard.set('data', {
            timestamp: Date.now(),
            content: data
        });

    } catch (error) {
        console.warn('Prefetch failed:', error);
    } finally {
        clearTimeout(timeoutId);
        isFetching = false;
    }
}

// Enhanced showLeaderboard with optimized rendering
async function showLeaderboard() {
    const leaderboardEl = document.getElementById('leaderboard');
    const leaderboardBody = document.getElementById('leaderboardBody');

    try {
        // Show loading state
        leaderboardEl.style.display = 'block';
        leaderboardBody.innerHTML = '<tr><td colspan="5"><div class="loader"></div></td></tr>';

        // Check cache first
        const cached = cachedLeaderboard.get('data');
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            renderLeaderboard(cached.content);
            return;
        }

        // Fetch new data with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${SERVER_URL}/api/leaderboard`, {
            signal: controller.signal,
            headers: {
                'Origin': 'https://logo-design-quizz-app-fronntend-luse4lksm.vercel.app',
                'Cache-Control': 'no-cache'
            },
            credentials: 'include'
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        // Update cache
        cachedLeaderboard.set('data', {
            timestamp: Date.now(),
            content: data
        });

        // Optimized rendering using DocumentFragment
        renderLeaderboard(data);

    } catch (error) {
        console.error('Leaderboard error:', error);
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="5">
                    ${cached ? 'Using cached data...' : 'Error loading data. Retrying...'}
                </td>
            </tr>`;
        
        // If error, use cached data if available
        if (cached) {
            setTimeout(() => renderLeaderboard(cached.content), 1000);
        }
    }
}

// Optimized rendering function
function renderLeaderboard(data) {
    const fragment = document.createDocumentFragment();
    const leaderboardBody = document.getElementById('leaderboardBody');

    // Clear existing content
    while (leaderboardBody.firstChild) {
        leaderboardBody.removeChild(leaderboardBody.firstChild);
    }

    // Batch create rows
    requestAnimationFrame(() => {
        data.forEach((result, index) => {
            const row = document.createElement('tr');
            
            // Use innerHTML for faster insertion
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${result.name || 'Anonymous'}</td>
                <td>${result.score}/5</td>
                <td>${formatTime(result.completionTime)}</td>
                <td>${new Date(result.submittedAt).toLocaleString('en-IN')}</td>
            `;

            // Add performance classes
            if (index < 3) {
                row.className = `rank-${index + 1}`;
            }

            fragment.appendChild(row);
        });

        // Single DOM update
        leaderboardBody.appendChild(fragment);
    });
}

// Initialize preloading when page loads
document.addEventListener('DOMContentLoaded', preloadLeaderboard);

// Add this CSS for better loading state
const styles = `
    .loader {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #FF6B6B;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 10px auto;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .rank-1 { background: linear-gradient(to right, #ffd70033, transparent); }
    .rank-2 { background: linear-gradient(to right, #c0c0c033, transparent); }
    .rank-3 { background: linear-gradient(to right, #cd7f3233, transparent); }
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

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