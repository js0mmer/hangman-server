import http from 'http';
import socketIO from 'socket.io';
import { Socket } from 'socket.io';
import Room from './room';

const port = process.env.PORT || 4000;

const server = http.createServer();
const io = new socketIO.Server(server, { cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }});

var rooms: { [id: string]: Room } = {}; // dictionary associating ids with rooms { id: Room }

/**
 * @return 6-digit code from 100000-999999 as a string
 */
function generateRoomId(): string {
    let id = Math.floor(Math.random() * 900000) + 100000; // generate 6-digit code from 100000-999999
    if (rooms[id] == null) { // make sure there isn't a room with that code on the 0.000000000001% chance
        return String(id);
    } else {
        return generateRoomId(); // generate new room code if it miraculously is a duplicate
    }
}

/**
 * @param socket The client socket
 * @return The room the client is in
 */
function getRoomFromClient(socket: Socket): Room {
    console.log(socket.rooms);
    let socketRooms = socket.rooms[Symbol.iterator]();
    socketRooms.next();
    let roomId = socketRooms.next().value;
    return rooms[roomId];
}

interface Guess {
    username: string,
    letter: string,
    color: string,
    result?: boolean
}

io.on('connection', (socket: Socket) => {
    socket.on('create_room', (word: string) => {
        let id = generateRoomId();
        rooms[id] = new Room(id, word, socket.id); // create room and store it in dictioinary

        socket.join(id); // make the host join the socket room

        socket.emit('room_code', id); // relay the code back to the client
    });

    socket.on('join_room', (id: string) => {
        if (rooms[id].hasStarted()) {
            socket.emit('already_started'); // don't let player join if it has already started
            return;
        }

        socket.join(id); // connect client socket to room

        socket.emit('word_length', rooms[id].getWordLength()) // send client the word length
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

        if (!room.hasStarted() || room.isGameLost() || room.isGameWon()) return; // make sure no guesses come in after the game has ended or before it's started

        if (!room.isTurn(socket.id)) return; // if it's not the players turn, ignore
        
        let result = undefined;

        if (!room.alreadyGuessed(letter)) { // if the letter was not already guessed
            result = room.guess(letter); // guess it and assign the result
        }

        let color = 'red';

        let guess: Guess = { username: room.getPlayerName(socket.id), letter, color, result }; // build guess response
        io.to(room.getId()).emit('guess', guess); // send guess response

        // TODO: notify next player of their turn

        if (room.isGameLost()) { // players ran out of guesses
            io.to(room.getId()).emit('lose');
            // TODO: handle game end
        } else if (room.isGameWon()) { // players correctly guessed word
            io.to(room.getId()).emit('win');
            // TODO: handle game end
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