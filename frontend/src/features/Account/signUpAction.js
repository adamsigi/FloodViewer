import { json } from "react-router-dom"
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


export async function signUpAction({ request }) {
    const res = await fetch(
        `${VITE_BACKEND_URL}/auth/users/`,
        {
            method: "post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(await request.json()),
        }
    )
    if (res.status === 400) {
        // Given the strict input validation on the client there shouldn't be any
        // validation errors returned from the backend.
        // The only expected error is when the email is already in use.
        return json({ error: 'Email already in use', status: res.status })
    }
    else if (res.status === 201) {
        return json({ status: res.status })
    }
    else {
        const data = await res.json()
        throw new Response(JSON.stringify(data), { status: res.status })
    }
}
