import { json, redirect } from "react-router-dom"
import { fetchAuth, isAuthenticated } from "@services/authService"
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


export async function userFloodmapsLoader({ request }) {
    // Loader runs before component is loaded.
    // Thus protected routes need the following check to avoid redundant unauthorized requests.
    if (!isAuthenticated()) {
        return redirect('/login')
    }
    const url = new URL(request.url)
    url.searchParams.set('owned', 'true')
    const queryParams = url.search
    const res = await fetchAuth(`${VITE_BACKEND_URL}/api/floodmaps/${queryParams}`, {
        method: 'GET',
        credentials: 'include',
    })
    if (res.status == 401) {
        // happens when the refresh token expires or the password changed from another session
        return redirect('/login')
    }
    else if (res.status == 200) {
        const data = await res.json()
        return json({ ...data, status: res.status })
    }
    else {  // Other responses => Error
        const data = await res.json()
        throw new Response(JSON.stringify(data), { status: res.status })
    }
}