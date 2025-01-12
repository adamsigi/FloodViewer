import { json, redirect } from "react-router-dom"
import { fetchAuth } from "@services/authService"
const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


export async function settingsAction({ request }) {
    let res
    if (request.method === 'POST') {
        res = await fetchAuth(
            `${VITE_BACKEND_URL}/auth/users/set_password/`,
            {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(await request.json()),
            }
        )
    }
    else if (request.method === 'DELETE') {
        res = await fetchAuth(
            `${VITE_BACKEND_URL}/auth/users/`,
            {
                method: "delete",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(await request.json()),
            }
        )
    }
    if (res.status === 400) {
        // Given the strict input validation on the client, there shouldn't be any
        // validation errors returned from the backend.
        // The only expected error is invalid password for both the delete account and
        // the change password scenarios.
        return json({ error: 'Invalid password', status: res.status })
    }
    else if (res.status === 401) {
        return redirect('/login')
    }
    else if (res.status === 204) {
        return json({ status: res.status })
    }
    else {
        const data = await res.json()
        throw new Response(JSON.stringify(data), { status: res.status })
    }
}