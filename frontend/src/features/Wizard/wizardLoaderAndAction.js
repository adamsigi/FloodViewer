import { json, redirect } from "react-router-dom"
import { fetchAuth, isAuthenticated, refreshAccessToken, tokenWillExpireInMinutes } from "@services/authService"
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


export async function wizardLoader() {
    // Going through the wizard could take effort and time.
    // If the refresh token expires during this time the user would get logged
    // out when trying to submit the job and he would have to start over.
    // Check for this case in the beginning by trying to acquire a new
    // access token at the first step of the wizard if it is about to expire.
    if (isAuthenticated() && tokenWillExpireInMinutes(10)) {
        const refreshRes = await refreshAccessToken()
        if (refreshRes.status === 401) {
            return redirect('/login')
        }
        return json({ ...refreshRes, status: refreshRes.status })
    }
    return json({ status: 200 })
}


export async function wizardAction({ request }) {
    const res = await fetchAuth(
        `${VITE_BACKEND_URL}/api/floodmaps/`,
        {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(await request.json()),
        }
    )
    if (res.status === 201) {
        const floodmap = await res.json()
        return redirect(`/floodmaps/${floodmap.id}`)
    }
    else if (res.status === 401) {
        // Shouldn't happen unless the refresh token expires and user spends more time in the
        // wizard than the lifetime of the last access token.
        return redirect('/login')
    }
    else {
        // Input is properly validated on the client, so there are no scenarios in which the
        // backend response is expected to be anything other than 201 or 401.
        // In case of unexpected errors (e.g. backend throws) they are handled in
        // wizard to avoid losing its state.
        const data = await res.json()
        return json({ ...data, status: res.status })
    }
}
