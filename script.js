let startTime;
let playerName = '';
let correctAnswers = 0;
let currentQuestion = 1;
let timerInterval;
const QUIZ_TIME_LIMIT = 30; // 2 minutes in seconds

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
    
    // Show result with current score and leaderboard button
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="final-score">
            <h3>${timeLeft <= 0 ? "Time's up!" : "Quiz Completed!"}</h3>
            <div class="score-details">
                <p class="score">Your Score: ${correctAnswers}/5</p>
                <p class="time">Time taken: ${completionTime} seconds</p>
            </div>
            <button onclick="viewLeaderboard()" class="view-leaderboard-btn">
                🏆 View Leaderboard
            </button>
        </div>
    `;
    resultDiv.style.display = 'block';
    
    try {
        // Save result to MongoDB
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
        
    } catch (error) {
        console.error('Error saving results:', error);
        resultDiv.innerHTML += `
            <p style="color: #ff4444;">Failed to save results. Please try again.</p>
            <button onclick="retrySaveResult(${completionTime})">Retry Save</button>
        `;
    } finally {
        // Remove timer display
        const timerDiv = document.getElementById('timer');
        if (timerDiv) {
            timerDiv.remove();
        }
        
        // Clear quiz state
        localStorage.removeItem('quizState');
    }
}

// Add function to view leaderboard
function viewLeaderboard() {
    // Hide result div
    document.getElementById('result').style.display = 'none';
    
    // Show leaderboard
    showLeaderboard();
    
    // Show corner button to go back to welcome page
    document.querySelector('.corner-button').style.display = 'block';
}

// Add some CSS for better styling
const styles = document.createElement('style');
styles.textContent = `
    .final-score {
        text-align: center;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .score-details {
        margin: 20px 0;
    }

    .score {
        font-size: 24px;
        color: #FF6B6B;
        font-weight: bold;
        margin: 10px 0;
    }

    .time {
        font-size: 18px;
        color: #666;
        margin: 10px 0;
    }

    .view-leaderboard-btn {
        background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%);
        color: white;
        padding: 12px 24px;
        border: none;
        border-radius: 50px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.3s ease;
        margin-top: 20px;
    }

    .view-leaderboard-btn:hover {
        transform: translateY(-2px);
    }
`;
document.head.appendChild(styles);

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
    
    if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
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
    
    // If answer is one word, do character matching
    if (!correctAnswer.toLowerCase().includes(' ')) {
        for (let i = 0; i < userAnswer.length && i < correctAnswer.length; i++) {
            if (userAnswer[i] === correctAnswer[i]) {
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
        const response = await fetch(`${SERVER_URL}/api/check-name`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://logo-design-quizz-app-fronntend-luse4lksm.vercel.app'
            },
            credentials: 'include',
            body: JSON.stringify({ name: playerName })
        });

        const data = await response.json();
        
        if (response.status === 400 && data.error === 'Name already exists') {
            alert('This name is already taken. Please choose a different name.');
            return;
        }

        if (!response.ok) {
            throw new Error(data.error || 'Failed to validate name');
        }

        // Start quiz if name is unique and format is valid
        startTime = Date.now();
        currentQuestion = 1;
        correctAnswers = 0;
        document.getElementById('nameInput').style.display = 'none';
        document.getElementById('quizSection').style.display = 'block';
        document.querySelector('.corner-button').style.display = 'none';
        document.getElementById(`question${currentQuestion}`).style.display = 'block';
        
        // Create and start timer
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

// Load state on page load
document.addEventListener('DOMContentLoaded', () => {
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