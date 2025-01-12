import '@testing-library/jest-dom'
import { screen, fireEvent, act } from '@testing-library/react'
import { test, expect, describe, } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { renderPath, finishLoading } from '@testing/helpers'
import { invalidEmailResponse, testEmail } from './testData'

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


describe('ResetPassword component', () => {

    test('renders correctly', async () => {
        await renderPath('/password_reset')
        expect(screen.getByRole('button', { name: /SEND EMAIL/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /CANCEL/ })).toBeInTheDocument()
        expect(screen.getByText(/Password reset/)).toBeInTheDocument()
    })

    test('shows error message on bad input', async () => {
        await renderPath('/password_reset')
        const emailInput = screen.getByLabelText(/Email/i)
        const sendEmailButton = screen.getByRole('button', { name: /SEND EMAIL/ })

        // Empty submission
        await act(() => {
            fireEvent.click(sendEmailButton)
        })
        expect(screen.getByText(/This field is required/)).toBeInTheDocument()

        // Invalid email and password
        const invalidEmail = 'test'
        await act(() => {
            fireEvent.change(emailInput, { target: { value: invalidEmail } })
        })
        expect(screen.getByText(/Invalid email address/)).toBeInTheDocument()
        expect(emailInput).toHaveValue(invalidEmail)  // email should not be cleared
    })

    test('loads login page on cancel', async () => {
        await renderPath('/password_reset')
        const cancelButton = screen.getByRole('button', { name: /CANCEL/ })

        await act(() => {
            fireEvent.click(cancelButton)
        })
        await finishLoading()  // wait for js code load (code-splitting)
        expect(screen.getByText(/Log in/)).toBeInTheDocument()
    })


    test('shows error message on auth failure', async () => {
        const server = setupServer(
            http.post(`${VITE_BACKEND_URL}/auth/users/reset_password/`, async ({ request }) => {
                const body = await request.json()
                if (body.email === testEmail) {
                    return new HttpResponse(null, { status: 204, })
                }
                else {
                    return HttpResponse.json(invalidEmailResponse, { status: 400 })
                }
            }),
        )
        server.listen()

        await renderPath('/password_reset')
        const emailInput = screen.getByLabelText(/Email/i)
        const sendEmailButton = screen.getByRole('button', { name: /SEND EMAIL/ })

        await act(() => {
            fireEvent.change(emailInput, { target: { value: testEmail + 'abc' } })  // wrong email
            fireEvent.click(sendEmailButton)
        })

        expect(screen.getByText(/User with given email does not exist/)).toBeInTheDocument()
        server.close()
    })

    test('shows validation message on success', async () => {
        const server = setupServer(
            http.post(`${VITE_BACKEND_URL}/auth/users/reset_password/`, async ({ request }) => {
                const body = await request.json()
                if (body.email === testEmail) {
                    return new HttpResponse(null, { status: 204, })
                }
                else {
                    return HttpResponse.json(invalidEmailResponse, { status: 400 })
                }
            }),
        )
        server.listen()

        await renderPath('/password_reset')
        const emailInput = screen.getByLabelText(/Email/i)
        const sendEmailButton = screen.getByRole('button', { name: /SEND EMAIL/ })

        await act(() => {
            fireEvent.change(emailInput, { target: { value: testEmail } })  // Correct email
            fireEvent.click(sendEmailButton)
        })

        expect(screen.getByText(/Password Reset Email Sent!/)).toBeInTheDocument()
        server.close()
    })
})
