let startTime;
let playerName = '';
let correctAnswers = 0;
let currentQuestion = 1;

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

// Function to check answer
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
    // Regular expression for name_rollno format
    const nameFormat = /^[a-zA-Z]+_[0-9]+$/;
    
    if (!nameFormat.test(name)) {
        return {
            isValid: false,
            message: 'Please enter your name in format: name_rollno (Example: john_123)'
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

    // Check if name exists
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