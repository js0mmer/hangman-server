import { Socket } from 'socket.io';
import Room from './room';

/**
 * Dictionary associating ids with rooms { id: Room }
 */
var rooms: { [id: string]: Room } = {};

/**
 * @return 6-digit code from 100000-999999 as a string
 */
export function generateRoomId(): string {
    let id = Math.floor(Math.random() * 900000) + 100000; // generate 6-digit code from 100000-999999
    if (rooms[id] == null) { // make sure there isn't a room with that code on the 0.000000000001% chance
        return String(id);
    } else {
        return generateRoomId(); // generate new room code if it miraculously is a duplicate
    }
}

/**
 * Gets a room by a client in it
 * @param socket The client socket
 * @return The room the client is in
 */
export function getRoomFromClient(socket: Socket): Room {
    console.log(socket.rooms);
    let socketRooms = socket.rooms[Symbol.iterator]();
    socketRooms.next();
    let roomId = socketRooms.next().value;
    return rooms[roomId];
}

/**
 * Gets a room by its id
 * @param id room id
 * @return the room
 */
export function getRoom(id: string): Room {
    return rooms[id];
}

/**
 * Adds a room
 * @param id
 * @param room 
 */
export function addRoom(id: string, room: Room) {
    rooms[id] = room;
}

/**
 * Deletes a room
 * @param id room id
 */
export function deleteRoom(id: string) {
    delete rooms[id];
}