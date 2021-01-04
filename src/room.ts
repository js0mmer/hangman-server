class Room {
    readonly word: string;
    readonly hostId: string;
    private players: { [id: string]: string };
    private guesses: string;
    private numCorrectGuesses: number;
    
    /**
     * @param word the word to be guessed
     * @param hostId id of the host player
     */
    constructor(word: string, hostId: string) {
        this.word = word;
        this.hostId = hostId;
        this.players = {};
        this.guesses = '';
        this.numCorrectGuesses = 0;
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
        return this.players[id];
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

}