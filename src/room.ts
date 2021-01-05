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
        this.turn = 0;
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
     * @param letter Guess
     * @return true if guess was correct, false if not
     */
    guess(letter: string): boolean {
        this.guesses += letter; // add letter to guesses

        if (this.word.includes(letter)) { // if the letter is in the word
            this.numCorrectGuesses++; // increment number of guesses
            return true;
        } else { // if not
            return false;
        }
    }

    /**
     * Determines if the guessers have lost
     * @return true if players ran out of guesses
     */
    isGameLost(): boolean {
        return this.guesses.length >= 7;
    }

    /**
     * Determines if the guessers have won
     * @return true if players guessed the whole word
     */
    isGameWon(): boolean {
        return this.numCorrectGuesses == this.word.length;
    }

    /**
     * Gets the room id
     * @return room id
     */
    getId(): string {
        return this.id;
    }

    /**
     * Gets the word length
     * @return word length
     */
    getWordLength(): number {
        return this.word.length;
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
     * @return the player who's turn it is
     */
    nextTurn(): string {
        this.turn++;

        if (this.turnOrder.length) { // if the end of the array has been passed
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
}