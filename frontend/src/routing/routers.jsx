import { lazy } from 'react'
import { createBrowserRouter, Navigate, } from "react-router-dom"
import LoadingScreen from '@layout/LoadingScreen.jsx'
import { Error, NotFound } from '@layout/ErrorPage.jsx'
import AppLayout from '@layout/AppLayout.jsx'
import { wizardAction, wizardLoader } from "../features/Wizard/wizardLoaderAndAction.js"
import { userFloodmapsLoader } from "../features/Floodmaps/List/userFloodmapsLoader.js"
import { resetPasswordAction } from "../features/Account/resetPasswordAction.js"
import { resetPasswordConfirmAction } from "../features/Account/resetPasswordConfirmAction.js"
import { signUpAction } from "../features/Account/signUpAction.js"
import { accountActivationLoader } from "../features/Account/accountActivationLoader.js"
import { settingsAction } from "../features/Account/settingsAction.js"
import { loginAction, logoutLoader } from "../features/Account/authenticationLoaderAndAction.js"
import { publicFloodmapsLoader } from "../features/Floodmaps/List/publicFloodmapsLoader.js"
import { floodmapLoader, floodmapAction } from "../features/Floodmaps/Details/floodmapLoaderAndAction.js"
import ProtectedRoute from "./ProtectedRoute.jsx"
// Need to load all components from x-date-pickers
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'


const LogIn = lazy(() => import("../features/Account/LogIn.jsx"))
const SignUp = lazy(() => import("../features/Account/SignUp.jsx"))
const Settings = lazy(() => import("../features/Account/Settings.jsx"))
const UserFloodmaps = lazy(() => import("../features/Floodmaps/List/UserFloodmaps.jsx"))
const AccountActivation = lazy(() => import("../features/Account/AccountActivation.jsx"))
const ResetPassword = lazy(() => import("../features/Account/ResetPassword.jsx"))
const ResetPasswordConfirm = lazy(() => import("../features/Account/ResetPasswordConfirm.jsx"))
const Floodmap = lazy(() => import("../features/Floodmaps/Details/Floodmap.jsx"))
const Wizard = lazy(() => import("../features/Wizard/Wizard.jsx"))
const PublicFloodmaps = lazy(() => import("../features/Floodmaps/List/PublicFloodmaps.jsx"))
const About = lazy(() => import("@layout/About.jsx"))


export const routes = [
    {
        path: "/",
        element: <Navigate to="/floodmaps" replace />,
    },
    {
        element: <AppLayout />,
        errorElement: <Error />,
        children: [
            {
                path: 'floodmaps/:floodmapId',
                element: <Floodmap />,
                loader: floodmapLoader,
                action: floodmapAction
            },
            {
                path: "create",
                element: <Wizard />,
                loader: wizardLoader,
                action: wizardAction,
            },
            {
                path: "floodmaps",
                element: <PublicFloodmaps />,
                loader: publicFloodmapsLoader,
            },
            {
                path: "about",
                element: <About />,
            },
            {
                path: 'jobs',
                element: (
                    <ProtectedRoute>
                        <UserFloodmaps />
                    </ProtectedRoute>
                ),
                loader: userFloodmapsLoader,
            },
            {
                path: "password_reset",
                element: <ResetPassword />,
                action: resetPasswordAction,
            },
            {
                path: "reset_password_confirm/:uid/:token",
                element: <ResetPasswordConfirm />,
                action: resetPasswordConfirmAction,
            },
            {
                path: "signup",
                element: <SignUp />,
                action: signUpAction,
            },
            {
                path: "activation/:uid/:token",
                element: <AccountActivation />,
                loader: accountActivationLoader,
            },
            {
                path: "login",
                element: <LogIn />,
                action: loginAction,
            },
            {
                path: 'settings',
                element: (
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                ),
                action: settingsAction,
            },
            {
                path: "logout",
                element: (
                    <ProtectedRoute>
                        <LoadingScreen />
                    </ProtectedRoute>
                ),
                loader: logoutLoader,
            }
        ]
    },
    {
        path: "*",
        element: <NotFound />
    }
]

export const browserRouter = createBrowserRouter(routes)
