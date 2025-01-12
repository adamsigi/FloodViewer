import { Navigate } from "react-router-dom"
import { useIsLoggedIn } from "../services/authService"

export default function ProtectedRoute({ children }) {
    const isLoggedIn = useIsLoggedIn()
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />
    }
    return children
}
