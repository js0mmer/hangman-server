import http from 'http';
import socketIO, { Socket } from 'socket.io';
import { addRoom, deleteRoom, generateRoomId, getRoom, getRoomFromClient } from './manager';
import Room from './room';

const port = process.env.PORT || 4000;

const server = http.createServer();
const io = new socketIO.Server(server, { cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }});

io.on('connection', (socket: Socket) => {
    socket.on('create_room', (word: string) => {
        let id = generateRoomId();
        addRoom(id, new Room(id, word, socket.id)); // create room and store it in dictioinary

        socket.join(id); // make the host join the socket room

        socket.emit('room_code', id); // relay the code back to the client
    });

    socket.on('join_room', (id: string) => {
        let room = getRoom(id);

        if (room.hasStarted()) {
            socket.emit('already_started'); // don't let player join if it has already started
            return;
        }

        socket.join(id); // connect client socket to room

        socket.emit('word_length', room.getWordLength()) // send client the word length
    });

    socket.on('username', (name: string) => {
        let room = getRoomFromClient(socket);

        if (room.hostId === socket.id) { // if this is the host
            room.setHostName(name);
            socket.emit('is_host');
        } else {
            room.addPlayer(socket.id, name); // adds player to the room
        }
    });

    socket.on('start_game', () => {
        let room = getRoomFromClient(socket);
        if (room.hostId !== socket.id) return; // return if not host

        io.to(room.id).emit('start_game'); // broadcast to clients that game has started
        room.startGame();
    });

    socket.on('guess', (letter: string) => {
        let room = getRoomFromClient(socket);
        let id = socket.id;

        if (!room.hasStarted() || room.isGameLost() || room.isGameWon()) return; // make sure no guesses come in after the game has ended or before it's started

        if (!room.isTurn(id)) return; // if it's not the players turn, ignore
        
        let result = undefined;

        if (!room.alreadyGuessed(letter)) { // if the letter was not already guessed
            result = room.guess(letter); // guess it and assign the result
        }

        let guess: {
            username: string,
            letter: string,
            result?: boolean
        } = { username: room.getPlayerName(id), letter, result }; // build guess response
        let roomId = room.getId();

        io.to(roomId).emit('guess', guess); // send guess response

        if (room.isGameLost()) { // players ran out of guesses
            io.to(roomId).emit('lose');
            deleteRoom(roomId);
        } else if (room.isGameWon()) { // players correctly guessed word
            io.to(roomId).emit('win');
            deleteRoom(roomId);
        } else { // neither, continue game and go to next player's turn
            let nextTurnUser = room.nextTurn();
            io.to(nextTurnUser).emit('is_turn'); // notifies user of their turn
        }
    });
});

io.on('disconnect', (socket: Socket) => {
    // let socketRooms: { id: string, room: number } = socket.rooms;

    // if (socketRooms.room == null) return; // if they never joined a room

    // let room = rooms[socketRooms.room];

    // if (room == null) return; // if the room is already deleted (host left)

    // if (room.removePlayer(socketRooms.id)) { // remove player from room
    //     delete rooms[socketRooms.room]; // delete room if it's empty
    // } else if (room.hostId === socketRooms.id) { // if this is the host
    //     delete rooms[socketRooms.room]; // delete room
    // }
});

server.listen(port, () => console.log(`Listening on port ${port}`));