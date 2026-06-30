import { sessionContext } from './session-context.js'
import io from 'https://cdn.socket.io/4.8.3/socket.io.esm.min.js'

const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8081'
    : 'https://dndassistantbackend.onrender.com'

export const socket = io(backendUrl)

socket.on('connect', () => {
    console.log("Frontend Connected", socket.id)

    socket.emit('session:join', {
        campaignId: sessionContext.campaignId,
        accessToken: localStorage.getItem('accessToken')
    })
})

socket.on('map:changeBackground', (data) => {
    try {
        const mapIframe = document.getElementById('main-map')
        
        if (mapIframe) {
            const iframeWindow = mapIframe.contentWindow

            if (iframeWindow && iframeWindow.setMapImage) {
                iframeWindow.setMapImage(data.imageUrl)
            }
        }
    } 
    catch (err) {
        console.error("Failed to sync map background from socket", err)
    }
})