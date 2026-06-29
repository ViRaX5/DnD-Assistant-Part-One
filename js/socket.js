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

socket.on('map:changeBackground', (data) => {
    try {
        const mapIframe = document.getElementById('main-map')
        
        if (mapIframe) {
            const iframeWindow = mapIframe.contentWindow
            
            // Pass the URL to the player's canvas!
            if (iframeWindow && iframeWindow.setMapImage) {
                iframeWindow.setMapImage(data.imageUrl)
            }
        }
    } 
    catch (err) {
        console.error("Failed to sync map background from socket", err)
    }
})

const backgroundAudio = new Audio()

backgroundAudio.volume = 0.5

socket.on('audio:syncPlay', (data) => {
    try {
        backgroundAudio.src = data.url
        backgroundAudio.play().catch(err => {
            console.warn("Browser blocked autoplay. The user must click the page first!", err)
        })
    } catch (err) {
        console.error("Failed to play synced audio", err);
    }
})

socket.on('audio:syncPause', () => {
    backgroundAudio.pause()
})

socket.on('audio:syncResume', () => {
    backgroundAudio.play().catch(err => console.warn("Autoplay blocked", err))
})

socket.on('audio:syncStop', () => {
    backgroundAudio.pause()
    backgroundAudio.src = ""
})

socket.on('audio:syncSeek', (data) => {
    backgroundAudio.currentTime = data.time
})

socket.on('audio:syncTargetVolume', (data) => {
    if (sessionContext.userId === data.targetUserId) {
        backgroundAudio.volume = data.volume
        console.log(`The DM forcefully changed your volume to ${Math.round(data.volume * 100)}%`)
    }
})