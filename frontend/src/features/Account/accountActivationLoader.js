import { json } from "react-router-dom"
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


export async function accountActivationLoader({ params }) {
    const res = await fetch(
        `${VITE_BACKEND_URL}/auth/users/activation/`,
        {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "uid": `${params.uid}`,
                "token": `${params.token}`
            }),
        }
    )
    if (res.status === 400) {
        return json({ error: 'User does not exist or has already been activated', status: res.status })
    }
    else if (res.status === 204) {
        return json({ status: res.status })
    }
    else {
        const data = await res.json()
        throw new Response(JSON.stringify(data), { status: res.status })
    }
}