const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8081'
    : 'https://dndassistantbackend.onrender.com'

const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

function forceLogout(reason, errorDetails = "") {
    console.error(`FORCED LOGOUT: ${reason}`, errorDetails);

    if (!isProduction) {
        alert(`Disconnected!\nReason: ${reason}`);
    }

    localStorage.removeItem('accessToken');
    window.location.href = './index.html';
}

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
        forceLogout("Access token is corrupted or malformed.", err)
        return null
    }
}

let refreshPromise = null

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

        if (!refreshPromise) {
            refreshPromise = fetch(`${BASE_URL}/api/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            }).then(async (refreshRes) => {
                if (!refreshRes.ok) {
                    throw new Error(`Backend rejected refresh. Status: ${refreshRes.status}`)
                }

                const data = await refreshRes.json();
                localStorage.setItem('accessToken', data.accessToken);
                return data.accessToken;
            }).catch((err) => {
                forceLogout("Refresh token failed or backend is unreachable. (Check Render logs or 5-device limit!)", err.message)
                throw err;
            }).finally(() => {
                // 2. Once the refresh finishes (success or fail), destroy the lock 
                // so it can trigger again in 15 minutes!
                refreshPromise = null;
            });
        }

        try {
            // 3. ALL simultaneous requests wait right here for the lock to resolve
            const newAccessToken = await refreshPromise;

            // 4. Once resolved, they all apply the new token and retry their original fetch!
            options.headers['Authorization'] = `Bearer ${newAccessToken}`;
            response = await fetch(url, options);
        }
        catch (err) {
            // If the refresh failed, just return the failed response (the user is being redirected anyway)
            return response;
        }
    }

    return response
}