import { redirect } from "react-router-dom"
import { isAuthenticated, loginUser, logoutUser } from "@services/authService"

export async function loginAction({ request }) {
    const args = await request.json()
    return loginUser(args?.email, args?.password)
}

export async function logoutLoader() {
    if (!isAuthenticated()) redirect('/login')
    await logoutUser()
    return redirect('/login')
}
