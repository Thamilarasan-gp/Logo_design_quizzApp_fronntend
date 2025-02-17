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
