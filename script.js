class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.score = 0;
        this.gameStarted = false;
        this.timer = null;
        this.timeElapsed = 0;
        this.hintsRemaining = 3;
        this.difficulty = 'easy';
        this.currentTheme = 'classic';
        this.soundEnabled = true;

        // Initialize sounds with better sound effects
        this.sounds = {
            flip: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-interface-click-1126.mp3'),
            match: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'),
            victory: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
            gameStart: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-level-music-689.mp3'),
            gameOver: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-game-over-trombone-1940.mp3')
        };

        // Set volumes
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.5; // Set volume to 50%
        });

        this.initializeGame();
    }

    initializeGame() {
        this.setupEventListeners();
        this.setupThemes();
        this.loadLeaderboard();
        this.setDifficulty('easy');
        
        // Preload all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.difficulty-select button').forEach(button => {
            button.addEventListener('click', () => this.setDifficulty(button.dataset.difficulty));
        });

        document.querySelectorAll('.theme-switcher button').forEach(button => {
            button.addEventListener('click', () => this.setTheme(button.dataset.theme));
        });

        document.getElementById('hint-btn').addEventListener('click', () => this.useHint());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('sound-toggle').addEventListener('click', () => this.toggleSound());
    }

    setDifficulty(level) {
        this.difficulty = level;
        const gridSizes = { easy: 16, medium: 36, hard: 64 };
        const timeLimit = { easy: 0, medium: 90, hard: 60 };
        
        this.createCards(gridSizes[level]);
        this.timeLimit = timeLimit[level];
        this.restartGame();
    }

    createCards(totalCards) {
        const gameGrid = document.getElementById('gameGrid');
        gameGrid.className = `game-grid grid-${this.difficulty}`;
        gameGrid.innerHTML = '';
        
        const pairs = totalCards / 2;
        const emojis = this.getRandomEmojis(pairs);
        this.cards = [...emojis, ...emojis]
            .sort(() => Math.random() - 0.5)
            .map((emoji, index) => this.createCardElement(emoji, index));
        
        this.cards.forEach(card => gameGrid.appendChild(card));
    }

    createCardElement(emoji, index) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-front">
                <span class="emoji" style="transform: rotateY(0deg);">${emoji}</span>
            </div>
            <div class="card-back">?</div>
        `;
        card.dataset.index = index;
        card.addEventListener('click', () => this.flipCard(card));
        return card;
    }

    flipCard(card) {
        if (!this.gameStarted) {
            this.startGame();
        }

        if (this.flippedCards.length === 2 || 
            card.classList.contains('flipped') || 
            card.classList.contains('matched')) {
            return;
        }

        // Play flip sound
        if (this.soundEnabled) {
            try {
                this.sounds.flip.currentTime = 0;
                this.sounds.flip.play().catch(error => console.log('Sound play failed:', error));
            } catch (error) {
                console.log('Sound error:', error);
            }
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateMoves();
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const match = card1.querySelector('.card-front').textContent === 
                     card2.querySelector('.card-front').textContent;

        if (match) {
            this.handleMatch(card1, card2);
        } else {
            this.handleMismatch(card1, card2);
        }
    }

    handleMatch(card1, card2) {
        // Play match sound
        if (this.soundEnabled) {
            try {
                this.sounds.match.currentTime = 0;
                this.sounds.match.play().catch(error => console.log('Sound play failed:', error));
            } catch (error) {
                console.log('Sound error:', error);
            }
        }

        card1.classList.add('matched');
        card2.classList.add('matched');
        this.matchedPairs++;
        this.updateScore(10);
        
        if (this.matchedPairs === this.cards.length / 2) {
            setTimeout(() => {
                if (this.soundEnabled) {
                    try {
                        this.sounds.victory.currentTime = 0;
                        this.sounds.victory.play().catch(error => console.log('Sound play failed:', error));
                    } catch (error) {
                        console.log('Sound error:', error);
                    }
                }
                this.gameWon();
            }, 500);
        }
        
        this.flippedCards = [];
    }

    handleMismatch(card1, card2) {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            this.flippedCards = [];
        }, 1000);
        this.updateScore(-5);
    }

    startGame() {
        this.gameStarted = true;
        if (this.soundEnabled) {
            try {
                this.sounds.gameStart.currentTime = 0;
                this.sounds.gameStart.play().catch(error => console.log('Sound play failed:', error));
            } catch (error) {
                console.log('Sound error:', error);
            }
        }
        this.startTimer();
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeElapsed++;
            this.updateTimer();
            if (this.timeLimit && this.timeElapsed >= this.timeLimit) {
                this.gameOver();
            }
        }, 1000);
    }

    updateTimer() {
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    }

    updateMoves() {
        document.getElementById('moves').textContent = this.moves;
    }

    useHint() {
        if (this.hintsRemaining > 0) {
            this.hintsRemaining--;
            document.getElementById('hint-btn').textContent = `Use Hint (${this.hintsRemaining})`;
            
            const unmatched = this.cards.filter(card => 
                !card.classList.contains('matched') && 
                !card.classList.contains('flipped')
            );

            if (unmatched.length >= 2) {
                const pair = this.findMatchingPair(unmatched);
                this.showHint(pair);
            }
        }
    }

    findMatchingPair(cards) {
        for (let i = 0; i < cards.length; i++) {
            for (let j = i + 1; j < cards.length; j++) {
                if (cards[i].querySelector('.card-front').textContent === 
                    cards[j].querySelector('.card-front').textContent) {
                    return [cards[i], cards[j]];
                }
            }
        }
        return [cards[0], cards[1]];
    }

    showHint(cards) {
        cards.forEach(card => {
            card.classList.add('flipped');
            setTimeout(() => card.classList.remove('flipped'), 1000);
        });
    }

    gameWon() {
        clearInterval(this.timer);
        this.saveScore();
        this.showGameOverModal(true);
    }

    gameOver() {
        clearInterval(this.timer);
        if (this.soundEnabled) {
            try {
                this.sounds.gameOver.currentTime = 0;
                this.sounds.gameOver.play().catch(error => console.log('Sound play failed:', error));
            } catch (error) {
                console.log('Sound error:', error);
            }
        }
        this.showGameOverModal(false);
    }

    showGameOverModal(won) {
        const modal = document.getElementById('gameOverModal');
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-time').textContent = 
            document.getElementById('timer').textContent;
        modal.style.display = 'flex';
    }

    saveScore() {
        const scores = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        scores.push({
            score: this.score,
            time: this.timeElapsed,
            difficulty: this.difficulty
        });
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem('leaderboard', JSON.stringify(scores.slice(0, 10)));
        this.updateLeaderboard();
    }

    loadLeaderboard() {
        const scores = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        this.updateLeaderboardDisplay(scores);
    }

    updateLeaderboardDisplay(scores) {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = scores
            .map((score, index) => `
                <div class="leaderboard-entry">
                    #${index + 1} - Score: ${score.score} | Time: ${Math.floor(score.time / 60)}:${(score.time % 60).toString().padStart(2, '0')}
                </div>
            `)
            .join('');
    }

    getRandomEmojis(count) {
        const emojiList = ['🎮', '🎲', '🎯', '🎪', '🎭', '🎨', '🎬', '🎤', 
                          '🎧', '🎵', '🎹', '🎸', '🎺', '🎻', '🎯', '🎱',
                          '🎳', '🎮', '🎲', '🎭', '🎨', '🎪', '🎫', '🎟️',
                          '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵', '🎹'];
        return emojiList.sort(() => Math.random() - 0.5).slice(0, count);
    }

    restartGame() {
        // Stop any playing sounds
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });

        clearInterval(this.timer);
        this.gameStarted = false;
        this.timeElapsed = 0;
        this.moves = 0;
        this.score = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.hintsRemaining = 3;
        
        this.updateTimer();
        this.updateMoves();
        this.updateScore(0);
        document.getElementById('hint-btn').textContent = `Use Hint (${this.hintsRemaining})`;
        
        this.cards.forEach(card => {
            card.classList.remove('flipped', 'matched');
        });
    }

    setTheme(theme) {
        document.body.dataset.theme = theme;
        this.currentTheme = theme;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('sound-toggle').textContent = this.soundEnabled ? '🔊' : '🔇';
        
        // Preload sounds when enabled
        if (this.soundEnabled) {
            Object.values(this.sounds).forEach(sound => {
                sound.load();
            });
        } else {
            // Stop all playing sounds when disabled
            Object.values(this.sounds).forEach(sound => {
                sound.pause();
                sound.currentTime = 0;
            });
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new MemoryGame();
}); 