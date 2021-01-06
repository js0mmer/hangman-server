import http from 'http';
import socketIO, { Socket } from 'socket.io';
import { addRoom, deleteRoom, generateRoomId, getRoom, getRoomFromClient } from './manager';
import Room, { RoomStatus } from './room';

const port = process.env.PORT || 4000;

const server = http.createServer();

const io = new socketIO.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] }});

io.on('connection', (socket: Socket) => {
    socket.on('create_room', (word: string) => {
        let id = generateRoomId();
        addRoom(id, new Room(id, word.toLowerCase(), socket.id)); // create room and store it in dictioinary

        socket.join(id); // make the host join the socket room

        socket.emit('room_code', id); // relay the code back to the client
    });

    socket.on('join_room', (id: string) => {
        let room = getRoom(id);

        if (room == null) {
            socket.emit('room_status', RoomStatus.INVALID);
        } else if (room.hasStarted()) {
            socket.emit('room_status', RoomStatus.STARTED); // don't let player join if it has already started
        } else {
            socket.emit('room_status', RoomStatus.OKAY);
        }
    });

    socket.on('username', (data: { roomId: string, name: string }) => {
        let room = getRoom(data.roomId);

        socket.emit('word_length', room.word.length) // send client the word length

        if (room.hostId === socket.id) { // if this is the host
            room.setHostName(data.name);
            socket.emit('is_host');
        } else {
            socket.join(data.roomId); // connect client socket to room
            socket.emit('player_list', room.getPlayerNames()); // notifies client of current players in the game
            room.addPlayer(socket.id, data.name); // adds player to the room
            io.to(room.id).emit('player_join', room.getPlayerName(socket.id)); // notify other players of join
        }
    });

    socket.on('start_game', () => {
        let room = getRoomFromClient(socket);
        if (room.hostId !== socket.id) return; // return if not host

        if (room.getPlayerCount() == 0) { // if no players
            socket.emit('no_players');
            return;
        }

        io.to(room.id).emit('start_game'); // broadcast to clients that game has started
        room.startGame();
        let nextTurnUser = room.nextTurn();
        io.to(nextTurnUser).emit('is_turn', room.getPlayerCount() != 1); // notifies user of their turn, second arg is so that there is no log if there's only 1 user
    });

    socket.on('guess', (guess: string) => {
        let room = getRoomFromClient(socket);
        let id = socket.id;

        let guessLower = guess.toLowerCase();

        if (!room.hasStarted() || room.isGameLost() || room.isGameWon()) return; // make sure no guesses come in after the game has ended or before it's started

        if (!room.isTurn(id)) return; // if it's not the players turn, ignore
        
        let result = undefined;

        if (!room.alreadyGuessed(guessLower)) { // if the letter was not already guessed
            result = room.guess(guessLower); // guess it and assign the result
        }

        let indices: number[] = [];

        if (result) {
            indices = room.getIndices(guessLower);
        }

        let guessResponse: {
            username: string,
            guess: string,
            indices: number[],
            result?: boolean
        } = { username: room.getPlayerName(id), guess, indices, result }; // build guess response
        let roomId = room.id;

        io.to(roomId).emit('guess', guessResponse); // send guess response

        if (room.isGameLost()) { // players ran out of guesses
            io.to(roomId).emit('lose');
            deleteRoom(roomId);
        } else if (room.isGameWon()) { // players correctly guessed word
            io.to(roomId).emit('win');
            deleteRoom(roomId);
        } else if (result != null) { // neither, continue game and go to next player's turn if the guess is valid
            socket.emit('turn_end'); // notify the user that their turn has ended
            let nextTurnUser = room.nextTurn();
            io.to(nextTurnUser).emit('is_turn', room.getPlayerCount() != 1); // notifies user of their turn, only shows message if more than 1 player
        }
    });

    socket.on('disconnecting', () => {
        let room = getRoomFromClient(socket);
        let id = socket.id;
    
        if (room == null) return; // if the room is already deleted (host left)
    
        let roomId = room.id;
    
         if (room.hostId === socket.id) { // if this is the hostId
            socket.to(roomId).emit('kick'); // kick all players
            deleteRoom(room.id); // delete room
            return;
        }

        io.to(room.id).emit('player_leave', room.getPlayerName(id)); // notify other players of disconnect
        room.removePlayer(id)

        if (room.isTurn(id)) { // if it's there turn then go to next player's turn
            let nextTurnUser = room.nextTurn();
            io.to(nextTurnUser).emit('is_turn', room.getPlayerCount() != 1);
        }
    });
});

server.listen(port, () => console.log(`Listening on port ${port}`));