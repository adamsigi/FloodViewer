import { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


let accessToken = null
let accessTokenExpiration = null

const STORAGE_KEY = 'isLoggedIn'
const STORAGE_VALUE = 'true'

function triggerStorageEvent(key, newValue) {
    const event = new Event('storage', { bubbles: true })
    event.key = key
    event.newValue = newValue
    window.dispatchEvent(event)
}

function setAuth(accessTokenResponse) {
    accessToken = accessTokenResponse.access
    accessTokenExpiration = jwtDecode(accessToken).exp
    localStorage.setItem(STORAGE_KEY, STORAGE_VALUE)
    triggerStorageEvent(STORAGE_KEY, STORAGE_VALUE)
}

export function clearAuth() {
    accessToken = null
    accessTokenExpiration = null
    localStorage.removeItem(STORAGE_KEY)
    triggerStorageEvent(STORAGE_KEY, '')
}

export async function refreshAccessToken() {
    const res = await fetch(`${VITE_BACKEND_URL}/auth/users/refresh/`, {
        method: 'POST',
        credentials: 'include',
    })
    if (res.status === 401) {
        clearAuth()  // no longer authenticated
    }
    const responseJson = await res.json()
    setAuth(responseJson)
    return { ...responseJson, status: res.status }
}


function hasActiveAccessToken() {
    if (accessToken === null) {
        return false
    }
    const currentTime = Date.now() / 1000
    if (currentTime > accessTokenExpiration) {
        return false
    }
    return true
}

export function tokenWillExpireInMinutes(mins) {
    const currentTime = Date.now() / 1000
    return accessTokenExpiration - currentTime < mins * 60
}

async function fetchWithAuthHeader(resource, options) {
    const res = await fetch(resource, {
        credentials: 'include',
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `JWT ${accessToken}`
        }
    })
    if (res.status === 401) {
        clearAuth()
    }
    return res
}


export function isAuthenticated() {
    return localStorage.getItem(STORAGE_KEY) === STORAGE_VALUE
}


export async function loginUser(email, password) {
    const res = await fetch(`${VITE_BACKEND_URL}/auth/users/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'email': email,
            'password': password,
        }),
    })
    const responseJson = await res.json()
    if (res.ok) {
        setAuth(responseJson)
    }
    return { ...responseJson, status: res.status }
}


export async function fetchAuth(resource, options = {}) {
    if (!isAuthenticated()) {
        return await fetch(resource, options)
    }
    if (hasActiveAccessToken()) {
        return await fetchWithAuthHeader(resource, options)
    }
    const refreshRes = await refreshAccessToken()
    if (refreshRes.status === 401) {
        return refreshRes
    }
    return await fetchWithAuthHeader(resource, options)
}


export async function logoutUser() {
    const res = await fetchAuth(`${VITE_BACKEND_URL}/auth/users/logout/`, {
        method: 'POST',
        credentials: 'include',
    })
    clearAuth()
    const responseJson = await res.json()
    return { ...responseJson, status: res.status }
}


export function useIsLoggedIn() {
    const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated())

    useEffect(() => {
        function handleStorageChange(event) {
            if (event.key === STORAGE_KEY) {
                setIsLoggedIn(event.newValue === STORAGE_VALUE)
            }
        }
        window.addEventListener('storage', handleStorageChange)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    return isLoggedIn
}
