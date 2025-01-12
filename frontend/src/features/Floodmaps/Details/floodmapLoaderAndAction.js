import { json, redirect } from "react-router-dom"
import { fetchAuth, } from "@services/authService"
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


export async function floodmapLoader({ params }) {
    const res = await fetchAuth(`${VITE_BACKEND_URL}/api/floodmaps/${params.floodmapId}/`, {
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

export async function floodmapAction({ params, request }) {
    const res = await fetchAuth(
        `${VITE_BACKEND_URL}/api/jobs/${params.floodmapId}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(await request.json()),
    })
    const data = await res.json()
    return json({ ...data, status: res.status })
}
