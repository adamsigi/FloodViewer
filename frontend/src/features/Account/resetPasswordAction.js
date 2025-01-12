import { json } from "react-router-dom"
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


export async function resetPasswordAction({ request }) {
    const res = await fetch(
        `${VITE_BACKEND_URL}/auth/users/reset_password/`,
        {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(await request.json()),
        }
    )
    if (res.status === 400) {
        // Email format is checked here on the client, so there shouldn't be any
        // validation errors returned from the backend.
        // The only expected error is when there is no user for the given email.
        return json({ error: 'No user was found with this email', status: res.status })
    }
    else if (res.ok) {
        return json({ status: res.status })
    }
    else {
        const data = await res.json()
        throw new Response(JSON.stringify(data), { status: res.status })
    }
}
