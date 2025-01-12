import { json } from "react-router-dom"
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


export async function resetPasswordConfirmAction({ request }) {
    const res = await fetch(
        `${VITE_BACKEND_URL}/auth/users/reset_password_confirm/`,
        {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(await request.json()),
        }
    )
    if (res.status === 400) {
        return json({ error: 'Invalid token or user id', status: res.status })
    }
    else if (res.status === 204) {
        return json({ status: res.status })
    }
    else {
        const data = await res.json()
        throw new Response(JSON.stringify(data), { status: res.status })
    }
}
