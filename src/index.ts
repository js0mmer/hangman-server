import { RSA_PKCS1_PADDING } from 'constants';
import http from 'http';
import socketIO from 'socket.io';

const port = process.env.PORT || 4000;

const server = http.createServer();
const io = new socketIO.Server(server);

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
function getRoomFromClient(socket: any): Room {
    let socketRooms: { id: string, room: number } = socket.rooms;
    return rooms[socketRooms.room];
}

interface Guess {
    username: string,
    letter: string,
    result?: boolean
}

io.on('connection', (socket: any) => {
    socket.on('create_room', (word: string) => {
        let id = generateRoomId();
        rooms[id] = new Room(id, word, socket.id); // create room and store it in dictioinary

        socket.join(id); // make the host join the socket room

        socket.emit('room_code', id); // relay the code back to the client
    });

    socket.on('join_room', (id: string) => {
        // TODO: handler username & adding player
    });

    socket.on('guess', (letter: string) => {
        let room = getRoomFromClient(socket);

        if (room.isGameLost() || room.isGameWon()) return; // make sure no guesses come in after the game has ended

        // TODO: keep track of turns
        
        let result = undefined;

        if (!room.alreadyGuessed(letter)) { // if the letter was not already guessed
            result = room.guess(letter); // guess it and assign the result
        }

        let guess: Guess = { username: room.getPlayerName(socket.id), letter, result }; // build guess response
        io.to(room.getId()).emit('guess', guess); // send guess response

        // TODO: notify next player of their turn

        if (room.isGameLost()) { // players ran out of guesses
            io.to(room.getId()).emit('lose');
            // TODO: handle game end
        } else if (room.isGameWon()) { // players correctly guessed word
            io.to(room.getId()).emit('win');
            // TODO: handle game end
        }
    });
});

io.on('disconnect', (socket: any) => {
    let socketRooms: { id: string, room: number } = socket.rooms;
    let room = rooms[socketRooms.room];
    if (room.removePlayer(socketRooms.id)) { // remove player from room
        delete rooms[socketRooms.room]; // delete room if it's empty
    }
});

server.listen(port, () => `Listening on port ${port}`);