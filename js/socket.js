import { sessionContext } from './session-context.js';
import io from 'https://cdn.socket.io/4.8.3/socket.io.esm.min.js';

const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8081'
    : 'https://dndassistantbackend.onrender.com';

export const socket = io(backendUrl);

socket.on('connect', () => {
    console.log("Frontend Connected", socket.id)

    socket.emit('session:join', {
        campaignId: sessionContext.campaignId,
        userId: sessionContext.userId,
        isDM: sessionContext.isDM
    })
})
