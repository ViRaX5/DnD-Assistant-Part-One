const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8081'
    : 'https://dndassistantbackend.onrender.com'

function getUserIdFromToken() {
    const token = localStorage.getItem('accessToken')

    if (!token) {
        window.location.href = './index.html'
        return null
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.userId
    }
    catch (err) {
        console.error("Failed to decode token:", err)
        window.location.href = './index.html'
        return null
    }
}

async function fetchWithAuth(url, options = {}) {
    let accessToken = localStorage.getItem('accessToken')
    
    options.headers = options.headers || {}

    if (accessToken) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    options.credentials = 'include'

    let response = await fetch(url, options)
    if (response.status === 401 || response.status === 403) {
        console.log("Access token expired or missing. Attempting silent refresh...")

        try {
            const refreshRes = await fetch(`${BASE_URL}/api/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include' 
            })

            if (refreshRes.ok) {
                const data = await refreshRes.json()
                
                localStorage.setItem('accessToken', data.accessToken);
                
                options.headers['Authorization'] = `Bearer ${data.accessToken}`;
                
                response = await fetch(url, options);
            } else {
                console.error("Refresh token expired or invalid. User must log in again.");
                localStorage.removeItem('accessToken');
                window.location.href = './index.html';
            }
        } 
        catch (err) {
            console.error("Failed to reach refresh endpoint:", err);
        }
    }

    return response
}