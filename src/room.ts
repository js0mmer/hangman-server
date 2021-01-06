import config from './config';

export enum RoomStatus {
    STARTED = 'STARTED',
    INVALID = 'INVALID',
    OKAY = 'OKAY'
}

export default class Room {
    readonly id: string;
    readonly word: string;
    readonly hostId: string;
    private hostName;
    private players: { [id: string]: string };
    private guesses: string;
    private numCorrectGuesses: number;
    private gameStarted: boolean;
    private turnOrder: string[];
    private turn: number;
    private numWrongGuesses: number;
    private guessedWord: boolean;
    
    /**
     * @param id room code
     * @param word the word to be guessed
     * @param hostId id of the host player
     */
    constructor(id: string, word: string, hostId: string) {
        this.id = id;
        this.word = word;
        this.hostId = hostId;
        this.hostName = '';
        this.players = {};
        this.guesses = '';
        this.numCorrectGuesses = 0;
        this.gameStarted = false;
        this.turnOrder = [];
        this.turn = -1;
        this.numWrongGuesses = 0;
        this.guessedWord = false;
    }

    /**
     * Adds a player to the room
     * @param id Player id
     * @param name Player name
     */
    addPlayer(id: string, name: string) {
        this.players[id] = name;
    }

    /**
     * Removes a player from the room
     * @param id Player id
     * @return true if the Room is empty, false if not
    */
    removePlayer(id: string): boolean {
        delete this.players[id];
        
        return Object.keys(this.players).length == 0;
    }

    /**
     * Gets a player's name
     * @param id Player id
     * @return Player name
     */
    getPlayerName(id: string): string {
        if (id === this.hostId) {
            return this.hostName;
        } else {
            return this.players[id];
        }
    }

    /**
     * Determines if the letter was already guessed
     * @param letter Guess
     * @return true if the letter was already guessed
     */
    alreadyGuessed(letter: string): boolean {
        return this.guesses.includes(letter);
    }

    /**
     * Guesses a letter
     * @param guess Guess (letter or whole word)
     * @return true if guess was correct, false if not
     */
    guess(guess: string): boolean {
        if (guess.length == 1) { // if letter
            this.guesses += guess; // add letter to guesses
    
            if (this.word.includes(guess)) { // if the letter is in the word
                this.numCorrectGuesses++; // increment number of guesses
                return true;
            } else { // if not
                this.numWrongGuesses++;
                return false;
            }
        } else { // if word
            if (this.word === guess) {
                this.guessedWord = true;
                return true;
            } else {
                this.numWrongGuesses++;
                return false;
            }
        }

    }

    /**
     * Determines if the guessers have lost
     * @return true if players ran out of guesses
     */
    isGameLost(): boolean {
        return this.numWrongGuesses >= config.maxGuesses;
    }

    /**
     * Determines if the guessers have won
     * @return true if players guessed the whole word
     */
    isGameWon(): boolean {
        if (this.guessedWord) return true;

        let uniqueLetters: string = '';
        for (var i = 0; i < this.word.length; i++) {
            let letter = this.word[i];
            if (!uniqueLetters.includes(letter)) {
                uniqueLetters += letter;
            }
        }
        return this.numCorrectGuesses == uniqueLetters.length;
    }

    /**
     * Determines if the game has started
     * @return true if the game has started
     */
    hasStarted(): boolean {
        return this.gameStarted;
    }

    /**
     * Starts the game
     */
    startGame() {
        this.gameStarted = true;
        // generate turn order
        let i = 0;
        for (var player in this.players) {
            this.turnOrder.push(player);
            i++;
        }
    }

    /**
     * Sets the username of the host
     * @param username
     */
    setHostName(username: string) {
        this.hostName = username;
    }

    /**
     * Moves to the next player's turn
     * @return the id of the player who's turn it is
     */
    nextTurn(): string {
        this.turn++;

        if (this.turn === this.turnOrder.length) { // if the end of the array has been passed
            this.turn = 0; // loop back to beginning
        }

        let nextTurnUser = this.turnOrder[this.turn];

        if (this.players[nextTurnUser] == null) { // if that player is no longer in the game
            this.nextTurn(); // next turn
        } else {
            return nextTurnUser;
        }

        return ''; // never reaches here but typescript mad
    }

    /**
     * Determines if it is the player's turn
     * @param id player id
     * @return true or false 
     */
    isTurn(id: string): boolean {
        return this.turnOrder[this.turn] === id;
    }

    /**
     * Gets the player count
     * @return player count
     */
    getPlayerCount(): number {
        return Object.keys(this.players).length;
    }

    /**
     * Get every index of the passed letter in the word
     * @param letter
     * @return number[] of indices
     */
    getIndices(letter: string): number[] {
        let indices: number[] = [];
        for(var i = 0; i < this.word.length; i++) {
            if (this.word[i] === letter) {
                indices.push(i);
            }
        }

        return indices;
    }
}