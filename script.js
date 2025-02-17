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

async function showLeaderboard() {
    try {
        const leaderboardBody = document.getElementById('leaderboardBody');
        leaderboardBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
        document.getElementById('leaderboard').style.display = 'block';

        const serverUrl = 'https://logo-design-quizzapp.onrender.com';
        const response = await fetch(`${serverUrl}/api/leaderboard`, {
            credentials: 'include',
            headers: {
                'Origin': 'https://logo-design-quizz-app-fronntend-luse4lksm.vercel.app'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        leaderboardBody.innerHTML = '';
        
        if (data.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="5">No scores yet!</td></tr>';
            return;
        }

        data.forEach((result, index) => {
            const row = document.createElement('tr');
            
            // Format the completion time
            const completionTimeStr = formatTime(result.completionTime);
            
            // Add a performance indicator
            const performance = `Score: ${result.score}/5 in ${completionTimeStr}`;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${result.name || 'Anonymous'}</td>
                <td>${result.score}/5</td>
                <td>${completionTimeStr}</td>
                <td>${new Date(result.submittedAt).toLocaleString('en-IN')}</td>
            `;
            
            // Highlight top performers
            if (index === 0) {
                row.style.backgroundColor = '#ffd700'; // Gold for first place
            } else if (index === 1) {
                row.style.backgroundColor = '#c0c0c0'; // Silver for second
            } else if (index === 2) {
                row.style.backgroundColor = '#cd7f32'; // Bronze for third
            }
            
            leaderboardBody.appendChild(row);
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="5">Error connecting to server. Please try again.</td>
            </tr>`;
    }
}

function hideLeaderboard() {
    document.getElementById('leaderboard').style.display = 'none';
    document.getElementById('nameInput').style.display = 'block';
    document.getElementById('quizSection').style.display = 'none';
    document.querySelector('.quiz-container h2').style.display = 'block';
    document.getElementById('question1').style.display = 'block';
    // Show the leaderboard button when returning to home
    document.querySelector('.corner-button').style.display = 'block';
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) {
        return '--:--';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

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