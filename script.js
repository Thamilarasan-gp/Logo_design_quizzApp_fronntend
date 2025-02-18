let startTime;
let playerName = '';
let correctAnswers = 0;
let currentQuestion = 1;
let timerInterval;
const QUIZ_TIME_LIMIT = 18// ... existing code ...
const express = require('express');
const app = express();

// Define batch schedules with start time and duration in minutes
const batchSchedules = {
    'batch1': { start: '09:00', duration: 60 }, // 60 minutes
    'batch2': { start: '10:00', duration: 60 },
    'batch3': { start: '11:00', duration: 60 },
    'batch4': { start: '12:00', duration: 60 }
};

// Middleware to check access
function checkAccess(req, res, next) {
    const { batchId } = req.query;

    if (!isBatchTimeValid(batchId)) {
        return res.status(403).send('Access denied. Invalid batch ID or time.');
    }
    next();
}

// Function to validate batch time
function isBatchTimeValid(batchId) {
    const currentTime = new Date();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    const batch = batchSchedules[batchId];
    if (!batch) return false;

    const [startHours, startMinutes] = batch.start.split(':').map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = startTimeInMinutes + batch.duration;

    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
}

// Route to access the quiz
app.get('/quiz', checkAccess, (req, res) => {
    res.send('Welcome to the quiz!');
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// ... existing code ...0; // 2 minutes in seconds

// Function to save quiz state
function saveQuizState() {
    localStorage.setItem('quizState', JSON.stringify({
        playerName,
        startTime,
        correctAnswers,
        currentQuestion,
        isQuizStarted: true
    }));
}

// Function to format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Add timer display to quiz section
function createTimer() {
    const timerDiv = document.createElement('div');
    timerDiv.id = 'timer';
    timerDiv.className = 'timer';
    timerDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary-color);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 18px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
    `;
    document.body.appendChild(timerDiv);
}

// Function to start timer
function startTimer() {
    let timeLeft = QUIZ_TIME_LIMIT;
    const timerDiv = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDiv.textContent = `Time Left: ${formatTime(timeLeft)}`;
        
        if (timeLeft <= 10) {
            timerDiv.style.animation = 'pulse 1s infinite';
            timerDiv.style.backgroundColor = '#ff4444';
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endQuiz();
        }
    }, 1000);
}

// Function to end quiz
async function endQuiz() {
    clearInterval(timerInterval);
    const completionTime = Math.floor((Date.now() - startTime) / 1000);
    
    // Hide all questions
    document.querySelectorAll('.question').forEach(q => {
        q.style.display = 'none';
    });
    
    // Show result
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <h3>Time's up!</h3>
        <p>Your score: ${correctAnswers}/5</p>
        <p>Time taken: ${completionTime} seconds</p>
    `;
    resultDiv.style.display = 'block';
    
    try {
        const response = await fetch(`${SERVER_URL}/api/save-result`, {
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
                entryTime: startTime,
                batchId: batchId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save results');
        }

        // Show leaderboard after 30 seconds
        setTimeout(() => {
            showLeaderboard();
        }, 30000);

    } catch (error) {
        console.error('Error saving results:', error);
        resultDiv.innerHTML += `
            <p style="color: #ff4444;">Failed to save results. Please try again.</p>
            <button onclick="retrySaveResult(${completionTime})">Retry Save</button>
        `;
    }
}

// Add retry function for failed saves
async function retrySaveResult(completionTime) {
    try {
        const response = await fetch(`${SERVER_URL}/api/save-result`, {
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

        if (!response.ok) {
            throw new Error('Failed to save results');
        }

        // Show success message and leaderboard
        document.getElementById('result').innerHTML = `
            <h3>Results saved successfully!</h3>
            <p>Your score: ${correctAnswers}/5</p>
            <p>Time taken: ${completionTime} seconds</p>
        `;
        await showLeaderboard();
        
    } catch (error) {
        console.error('Error in retry save:', error);
        alert('Failed to save results. Please try again.');
    }
}

// Function to check answer
function checkAnswer(questionNumber, correctAnswer) {
    const userAnswer = document.getElementById(`answer${questionNumber}`).value.trim();
    
    // Create array of acceptable answers for question 1
    const acceptableAnswers = questionNumber === 1 ? ['IT', 'INFORMATION TECHNOLOGY'] : [correctAnswer];
    
    // Check if answer is correct (any of the acceptable answers)
    if (acceptableAnswers.some(answer => userAnswer.toUpperCase() === answer.toUpperCase())) {
        correctAnswers++;
        document.getElementById(`question${questionNumber}`).style.display = 'none';
        
        if (questionNumber === 5) {
            endQuiz();
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
    
    // For question 1, check both possible answers for partial matches
    if (questionNumber === 1) {
        const bestMatch = acceptableAnswers.map(answer => {
            if (!answer.includes(' ')) {
                // For single word answers (IT)
                let chars = 0;
                for (let i = 0; i < userAnswer.length && i < answer.length; i++) {
                    if (userAnswer[i].toUpperCase() === answer[i]) {
                        chars++;
                    } else {
                        break;
                    }
                }
                return { chars, totalChars: answer.length };
            } else {
                // For multi-word answers (Information Technology)
                const userWords = userAnswer.toUpperCase().split(' ');
                const correctWords = answer.split(' ');
                let matchedWords = 0;
                userWords.forEach(word => {
                    if (correctWords.map(w => w.toUpperCase()).includes(word)) {
                        matchedWords++;
                    }
                });
                return { words: matchedWords, totalWords: correctWords.length };
            }
        }).reduce((best, current) => {
            if (current.chars > (best.chars || 0)) return current;
            if (current.words > (best.words || 0)) return current;
            return best;
        }, {});

        if (bestMatch.chars) {
            feedback = `Matched ${bestMatch.chars} character${bestMatch.chars > 1 ? 's' : ''}. `;
            feedback += `${bestMatch.totalChars - bestMatch.chars} character${bestMatch.totalChars - bestMatch.chars > 1 ? 's' : ''} remaining.`;
        } else if (bestMatch.words) {
            feedback = `Matched ${bestMatch.words} word${bestMatch.words > 1 ? 's' : ''}. `;
            feedback += `${bestMatch.totalWords - bestMatch.words} word${bestMatch.totalWords - bestMatch.words > 1 ? 's' : ''} remaining.`;
        } else {
            feedback = 'No matches found. Try again!';
        }
    } else {
        // Original logic for other questions
        if (!correctAnswer.toLowerCase().includes(' ')) {
            // Single word matching
            for (let i = 0; i < userAnswer.length && i < correctAnswer.length; i++) {
                if (userAnswer[i].toLowerCase() === correctAnswer[i].toLowerCase()) {
                    matchedChars++;
                } else {
                    break;
                }
            }

            if (matchedChars > 0) {
                feedback = `Matched ${matchedChars} character${matchedChars > 1 ? 's' : ''}. `;
                feedback += `${correctAnswer.length - matchedChars} character${correctAnswer.length - matchedChars > 1 ? 's' : ''} remaining.`;
            } else {
                feedback = 'No matching characters. Try again!';
            }

            if (userAnswer.length !== correctAnswer.length) {
                feedback += `\nHint: The answer has ${correctAnswer.length} characters.`;
            }
        } else {
            // Multi-word matching
            const correctWords = correctAnswer.toLowerCase().split(' ');
            const userWords = userAnswer.toLowerCase().split(' ');
            let matchedWords = 0;

            userWords.forEach(word => {
                if (correctWords.includes(word)) {
                    matchedWords++;
                }
            });

            if (matchedWords > 0) {
                feedback = `Matched ${matchedWords} word${matchedWords > 1 ? 's' : ''}. `;
                feedback += `${correctWords.length - matchedWords} word${correctWords.length - matchedWords > 1 ? 's' : ''} remaining.`;
            } else {
                feedback = 'No matches found. Try again!';
            }

            if (userWords.length !== correctWords.length) {
                feedback += `\nHint: The answer has ${correctWords.length} words.`;
            }
        }
    }

    // Show feedback
    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.color = matchedChars > 0 ? '#ff9800' : '#f44336';
    feedbackDiv.style.marginTop = '10px';
    feedbackDiv.style.padding = '10px';
    feedbackDiv.style.borderRadius = '5px';
    feedbackDiv.style.backgroundColor = '#fff3e0';
    feedbackDiv.textContent = feedback;

    // Remove existing feedback
    const existingFeedback = document.querySelector(`#question${questionNumber} .feedback`);
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Add new feedback
    feedbackDiv.className = 'feedback';
    document.getElementById(`answer${questionNumber}`).parentNode.appendChild(feedbackDiv);

    // Clear feedback after 3 seconds
    setTimeout(() => {
        feedbackDiv.remove();
    }, 3000);
}

// Function to validate name format (name_rollno)
function validateNameFormat(name) {
    // Regular expression for name_rollno format where rollno can be alphanumeric
    const nameFormat = /^[a-zA-Z]+_[a-zA-Z0-9]+$/;
    
    if (!nameFormat.test(name)) {
        return {
            isValid: false,
            message: 'Please enter your name in format: name_rollno (Example: thamil_a54h or thamil_23It97)'
        };
    }
    
    return {
        isValid: true,
        message: ''
    };
}

// Function to start quiz
async function startQuiz() {
    playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }

    // Validate name format
    const validation = validateNameFormat(playerName);
    if (!validation.isValid) {
        alert(validation.message);
        return;
    }

    try {
        const response = await fetch(`${SERVER_URL}/api/check-name?batchId=${batchId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://logo-design-quizz-app-fronntend-luse4lksm.vercel.app'
            },
            credentials: 'include',
            body: JSON.stringify({ name: playerName })
        });

        const data = await response.json();
        
        if (!response.ok) {
            alert(data.message);
            return;
        }

        // Start quiz if everything is valid
        startTime = Date.now();
        currentQuestion = 1;
        correctAnswers = 0;
        document.getElementById('nameInput').style.display = 'none';
        document.getElementById('quizSection').style.display = 'block';
        document.querySelector('.corner-button').style.display = 'none';
        document.getElementById(`question${currentQuestion}`).style.display = 'block';
        
        createTimer();
        startTimer();
        
        saveQuizState();

    } catch (error) {
        console.error('Error checking name:', error);
        alert('Error starting quiz: ' + error.message);
    }
}

// Function to load quiz state
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

// Get batch ID from URL
const queryParams = new URLSearchParams(window.location.search);
const batchId = queryParams.get('batchId');

// Add batch validation on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!batchId) {
        showError('Please use the correct batch link to access the quiz.');
        document.getElementById('playerName').disabled = true;
        document.querySelector('.start-button').disabled = true;
        return;
    }
    loadQuizState();
});

// Cache DOM elements
const leaderboardEl = document.getElementById('leaderboard');
const leaderboardBody = document.getElementById('leaderboardBody');
const quizSection = document.getElementById('quizSection');
const nameInput = document.getElementById('nameInput');

// Constants and cache
const SERVER_URL = 'https://logo-design-quizzapp.onrender.com';
const CACHE_KEY = 'leaderboardCache';
const CACHE_DURATION = 3000; // 3 seconds cache
let cachedData = null;
let isFetching = false;
let prefetchTimer = null;

// Preload and background sync
function initializeLeaderboard() {
    // Initial prefetch
    prefetchData();
    
    // Background sync every 3 seconds if tab is visible
    prefetchTimer = setInterval(() => {
        if (document.visibilityState === 'visible') {
            prefetchData();
        }
    }, CACHE_DURATION);
}

// Optimized prefetch
async function prefetchData() {
    if (isFetching) return;
    isFetching = true;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${SERVER_URL}/api/leaderboard`, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            credentials: 'include',
            priority: 'high'
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        cachedData = data;
        
        // If leaderboard is visible, update it
        if (document.getElementById('leaderboard').style.display !== 'none') {
            renderLeaderboard(data);
        }

    } catch (error) {
        console.warn('Prefetch failed:', error);
    } finally {
        isFetching = false;
    }
}

// Enhanced show leaderboard function
async function showLeaderboard() {
    const leaderboardEl = document.getElementById('leaderboard');
    const leaderboardBody = document.getElementById('leaderboardBody');

    // Show immediately with loading state if no cache
    leaderboardEl.style.display = 'block';
    
    // Show cached data first if available
    if (cachedData) {
        renderLeaderboard(cachedData);
    } else {
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="loading-spinner"></div>
                </td>
            </tr>`;
    }

    // Fetch fresh data
    try {
        const data = await fetchLeaderboard();
        if (data) {
            renderLeaderboard(data);
        }
    } catch (error) {
        if (!cachedData) {
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="5" class="error-message">
                        Unable to load leaderboard. Please try again.
                    </td>
                </tr>`;
        }
    }
}

// Optimized render function
function renderLeaderboard(data) {
    if (!data || !data.length) return;

    const leaderboardBody = document.getElementById('leaderboardBody');
    const fragment = document.createDocumentFragment();

    // Sort once and cache
    const sortedData = data.sort((a, b) => b.score - a.score || a.completionTime - b.completionTime);

    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
        sortedData.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.className = `leaderboard-row ${index < 3 ? `rank-${index + 1}` : ''}`;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name || 'Anonymous'}</td>
                <td>${entry.score}/5 ${index === 0 ? '👑' : ''}</td>
                <td>${entry.completionTime}s</td>
                <td>${new Date(entry.submittedAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</td>
            `;

            fragment.appendChild(row);
        });

        leaderboardBody.innerHTML = '';
        leaderboardBody.appendChild(fragment);
    });
}

// Add this CSS for better visual feedback
const additionalStyles = `
    .leaderboard-row {
        animation: slideIn 0.3s ease-out forwards;
        opacity: 0;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .error-message {
        color: #FF6B6B;
        text-align: center;
        padding: 20px;
        font-weight: 500;
    }

    .loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #FF6B6B;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 20px auto;
    }
`;

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeLeaderboard);

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (prefetchTimer) {
        clearInterval(prefetchTimer);
    }
});

// Add this CSS for better loading state
const styles = `
    #leaderboard {
        transition: opacity 0.3s ease;
    }

    #leaderboard.fade-out {
        opacity: 0;
    }
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Function to hide leaderboard and show welcome page
// Function to hide leaderboard and show welcome page
function hideLeaderboard() {
    const leaderboardEl = document.getElementById('leaderboard');
    const welcomeContainer = document.getElementById('nameInput');
    const quizSection = document.getElementById('quizSection');

    // Add fade-out animation
    leaderboardEl.classList.add('fade-out');

    // After animation, hide leaderboard and show welcome page
    setTimeout(() => {
        leaderboardEl.style.display = 'none';
        leaderboardEl.classList.remove('fade-out');

        // Always show welcome page when closing from home leaderboard
        welcomeContainer.style.display = 'block';
        quizSection.style.display = 'none';
        
        // Show corner button again
        document.querySelector('.corner-button').style.display = 'block';
    }, 300);
}
// Function to show leaderboard from home page
function showLeaderboardFromHome() {
    const welcomeContainer = document.getElementById('nameInput');
    const quizSection = document.getElementById('quizSection');
    const leaderboardEl = document.getElementById('leaderboard');

    // Hide welcome container
    welcomeContainer.style.display = 'none';
    
    // Show quiz section (needed because leaderboard is inside it)
    quizSection.style.display = 'block';
    
    // Show leaderboard with fade-in
    leaderboardEl.style.opacity = '0';
    leaderboardEl.style.display = 'block';
    
    // Trigger fade-in
    setTimeout(() => {
        leaderboardEl.style.opacity = '1';
    }, 10);

    // Fetch and display data
    fetchLeaderboard();
}

// Update fetchLeaderboard to include batchId
async function fetchLeaderboard() {
    try {
        const response = await fetch(`${SERVER_URL}/api/leaderboard?batchId=${batchId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://logo-design-quizz-app-fronntend-luse4lksm.vercel.app'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard data');
        }

        const data = await response.json();
        renderLeaderboard(data);
        return data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        showError('Failed to load leaderboard. Please try again.');
    }
}

// Add error display function
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #ff6b6b;
        color: white;
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
        text-align: center;
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    document.querySelector('.welcome-container').prepend(errorDiv);
}