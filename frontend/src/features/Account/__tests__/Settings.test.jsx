import '@testing-library/jest-dom'
import { screen, fireEvent, act, } from '@testing-library/react'
import { test, expect, describe, } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { renderPath, finishLoading } from '@testing/helpers'
import {
    accessTokenResponse,
    failedAuthResponse,
    failedPasswordChangeResponse,
    floodmapsResponse,
    invalidPasswordResponse,
    testEmail,
    testPassword,
    testPasswordNew
} from './testData'

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


describe('Settings component', () => {

    async function LoginAndGotoSettings() {
        const server = setupServer(
            http.post(`${VITE_BACKEND_URL}/auth/users/login/`, async ({ request }) => {
                const body = await request.json()
                if (body.email === testEmail && body.password === testPassword) {
                    return HttpResponse.json(accessTokenResponse, { status: 200 })
                }
                else {
                    return HttpResponse.json(failedAuthResponse, { status: 401 })
                }
            }),
            // Should redirect to floodmaps and make call to get floodmap data after log in
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/`, () => {
                return HttpResponse.json(floodmapsResponse)
            }),
        )
        server.listen()

        await renderPath('/login')
        const emailInput = screen.getByLabelText(/Email/i)
        const passwordInput = screen.getByLabelText(/Password/i)
        const submitButton = screen.getByRole('button', { name: /LOG IN/ })

        await act(() => {
            fireEvent.change(emailInput, { target: { value: testEmail } })
            fireEvent.change(passwordInput, { target: { value: testPassword } })
            fireEvent.click(submitButton)
        })

        const userMenuButton = screen.getByTestId('AccountCircleIcon')
        await act(() => {
            fireEvent.click(userMenuButton)
        })
        const settingsButton = screen.getByRole('menuitem', { name: /Settings/ })
        await act(() => {
            fireEvent.click(settingsButton)
        })
        await finishLoading()  // wait for js code load (code-splitting)
        server.close()
    }

    test('redirects to login if user is not authenticated', async () => {
        await renderPath('/settings')
        expect(screen.getByRole('button', { name: /LOG IN/ })).toBeInTheDocument()
        expect(screen.getByText(/Log in/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    })

    test('renders correctly', async () => {
        await LoginAndGotoSettings()
        expect(screen.getByText(/Change Password/)).toBeInTheDocument()
        expect(screen.getByText(/Delete Account/)).toBeInTheDocument()
        expect(screen.getByLabelText(/^Current Password/))
        expect(screen.getByLabelText(/^New Password/))
        expect(screen.getByLabelText(/^Confirm New Password/))
        expect(screen.getByRole('button', { name: /CHANGE PASSWORD/ }))
    })

    test('change password form validates input and submits properly', async () => {
        await LoginAndGotoSettings()
        const currentPasswordInput = screen.getByLabelText(/^Current Password/)
        const newPasswordInput = screen.getByLabelText(/^New Password/)
        const confirmNewPasswordInput = screen.getByLabelText(/^Confirm New Password/)
        const changePasswordButton = screen.getByRole('button', { name: /CHANGE PASSWORD/ })

        // Empty submission
        await act(() => {
            fireEvent.click(changePasswordButton)
        })
        expect(screen.getAllByText(/This field is required/).length === 3)

        // New password same as existing password
        await act(() => {
            fireEvent.change(currentPasswordInput, { target: { value: testPassword } })
            fireEvent.change(newPasswordInput, { target: { value: testPassword } })
            fireEvent.change(confirmNewPasswordInput, { target: { value: testPassword } })
        })
        expect(screen.getByText(/New password cannot be the same as the current password/)).toBeInTheDocument()

        // Confirm new password != new password
        await act(() => {
            fireEvent.change(currentPasswordInput, { target: { value: testPassword } })
            fireEvent.change(newPasswordInput, { target: { value: testPassword } })
            fireEvent.change(confirmNewPasswordInput, { target: { value: testPasswordNew } })
        })
        expect(screen.getByText(/Passwords do not match/)).toBeInTheDocument()

        // Submit properly
        const server = setupServer(
            http.post(`${VITE_BACKEND_URL}/auth/users/set_password/`, async ({ request }) => {
                const body = await request.json()
                if (body.current_password === testPassword && body.new_password === testPasswordNew
                    && body.re_new_password === testPasswordNew) {
                    return new HttpResponse(null, { status: 204, })
                }
                else {
                    return HttpResponse.json(failedPasswordChangeResponse, { status: 400 })
                }
            }),
        )
        server.listen()

        await act(() => {
            fireEvent.change(currentPasswordInput, { target: { value: testPassword } })
            fireEvent.change(newPasswordInput, { target: { value: testPasswordNew } })
            fireEvent.change(confirmNewPasswordInput, { target: { value: testPasswordNew } })
            fireEvent.click(changePasswordButton)
        })
        // Should log out and redirect to login screen after success
        expect(screen.getByRole('button', { name: /LOG IN/ })).toBeInTheDocument()
        expect(screen.getByText(/Log in/)).toBeInTheDocument()
        expect(screen.getByText(/Password changed/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
        server.close()
    })

    test('cancel button on delete account shows settings again', async () => {
        await LoginAndGotoSettings()
        const deleteAccountButton = screen.getByRole('button', { name: /DELETE ACCOUNT/ })

        await act(() => {
            fireEvent.click(deleteAccountButton)
        })
        expect(screen.getByText(/Delete Account/)).toBeInTheDocument()

        const cancelButton = screen.getByRole('button', { name: /CANCEL/ })
        await act(() => {
            fireEvent.click(cancelButton)
        })
        expect(screen.getByText(/Change Password/)).toBeInTheDocument()
        expect(screen.getByText(/Delete Account/)).toBeInTheDocument()
    })

    test('delete account form validates input and submits properly', async () => {
        await LoginAndGotoSettings()
        const deleteAccountButton = screen.getByRole('button', { name: /DELETE ACCOUNT/ })

        await act(() => {
            fireEvent.click(deleteAccountButton)
        })
        const deleteButton = screen.getByRole('button', { name: /DELETE/ })

        // Empty submission
        await act(() => {
            fireEvent.click(deleteButton)
        })

        expect(screen.getByText(/This field is required/)).toBeInTheDocument()

        // Submit properly
        const server = setupServer(
            http.delete(`${VITE_BACKEND_URL}/auth/users/`, async ({ request }) => {
                const body = await request.json()
                if (body.current_password === testPassword) {
                    return new HttpResponse(null, { status: 204, })
                }
                else {
                    return HttpResponse.json(invalidPasswordResponse, { status: 400 })
                }
            }),
        )
        server.listen()

        // Wrong password
        const passwordInput = screen.getByLabelText(/Password/)
        await act(() => {
            fireEvent.change(passwordInput, { target: { value: testPasswordNew } })
            fireEvent.click(deleteButton)
        })
        expect(screen.getByText(/Invalid password/)).toBeInTheDocument()

        // Correct password
        await act(() => {
            fireEvent.change(passwordInput, { target: { value: testPassword } })
            fireEvent.click(deleteButton)
        })

        // Should log out and redirect to login screen after success
        expect(screen.getByRole('button', { name: /LOG IN/ })).toBeInTheDocument()
        expect(screen.getByText(/Log in/)).toBeInTheDocument()
        expect(screen.getByText(/Account deleted/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
        server.close()
    })
})
