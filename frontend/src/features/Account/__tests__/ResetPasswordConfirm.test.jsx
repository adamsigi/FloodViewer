import { screen, fireEvent, act, } from '@testing-library/react'
import { test, expect, describe, } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { renderPath, finishLoading } from '@testing/helpers'
import { failedPasswordResetResponse, testPassword, testToken, testUID } from './testData'

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


describe('RestPasswordConfirmation component', () => {

    test('renders correctly', async () => {
        await renderPath(`/reset_password_confirm/${testUID}/${testToken}`)
        expect(screen.getByRole('button', { name: /SUBMIT/ })).toBeInTheDocument()
        expect(screen.getByText(/Password reset/)).toBeInTheDocument()
        expect(screen.getByLabelText(/^New Password/)).toBeInTheDocument()
        expect(screen.getByLabelText(/^Confirm New Password/)).toBeInTheDocument()
    })


    test('shows error message on bad input', async () => {
        await renderPath(`/reset_password_confirm/${testUID}/${testToken}`)
        const newPasswordInput = screen.getByLabelText(/^New Password/)
        const confirmNewPasswordInput = screen.getByLabelText(/^Confirm New Password/)
        const submitButton = screen.getByRole('button', { name: /SUBMIT/ })

        // Empty submission
        await act(() => {
            fireEvent.click(submitButton)
        })
        expect(screen.getAllByText(/This field is required/).length === 2)

        // Invalid new password and confirm new password
        await act(() => {
            fireEvent.change(newPasswordInput, { target: { value: '123' } })
            fireEvent.change(confirmNewPasswordInput, { target: { value: '456' } })
        })
        expect(screen.getByText(/Password must be at least 8 characters long/)).toBeInTheDocument()
        expect(screen.getByText(/Passwords do not match/)).toBeInTheDocument()
    })


    test('redirect to login page after success', async () => {
        const server = setupServer(
            http.post(`${VITE_BACKEND_URL}/auth/users/reset_password_confirm/`, async ({ request }) => {
                const body = await request.json()
                if (body.uid === testUID && body.token === testToken
                    && body.new_password === testPassword && body.re_new_password === testPassword) {
                    return new HttpResponse(null, { status: 204, })
                }
                else {
                    return HttpResponse.json(failedPasswordResetResponse, { status: 400 })
                }
            }),
        )
        server.listen()

        await renderPath(`/reset_password_confirm/${testUID}/${testToken}`)
        const newPasswordInput = screen.getByLabelText(/^New Password/)
        const confirmNewPasswordInput = screen.getByLabelText(/^Confirm New Password/)
        const submitButton = screen.getByRole('button', { name: /SUBMIT/ })

        await act(() => {
            fireEvent.change(newPasswordInput, { target: { value: testPassword } })
            fireEvent.change(confirmNewPasswordInput, { target: { value: testPassword } })
            fireEvent.click(submitButton)
        })
        await finishLoading()  // wait for js code load (code-splitting)
        expect(screen.getByText(/Log in/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
        expect(screen.getByText(/Password reset successful/)).toBeInTheDocument()

        server.close()
    })
})
