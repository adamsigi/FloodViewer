import { RouterProvider, } from "react-router-dom"
import LoadingScreen from './layout/LoadingScreen.jsx'
import { browserRouter } from './routing/routers.jsx'


export default function App() {
    return (
        <RouterProvider router={browserRouter} fallbackElement={<LoadingScreen />} />
    )
}
