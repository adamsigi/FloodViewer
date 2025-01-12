import '@testing-library/jest-dom'
import { screen, fireEvent, act } from '@testing-library/react'
import { test, expect, describe, } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { renderPath, finishLoading } from '@testing/helpers'
import { accessTokenResponse, authErrorResponse, failedAuthResponse, floodmapsResponse, testEmail, testPassword } from './testData'

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


describe('LogIn component', () => {

    test('renders correctly', async () => {
        await renderPath('/login')
        expect(screen.getByRole('button', { name: /LOG IN/ })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Sign up/ })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Forgot password?/ })).toBeInTheDocument()
        expect(screen.getByText(/Log in/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/)).toBeInTheDocument()
    })

    test('shows error message on bad input', async () => {
        await renderPath('/login')
        const emailInput = screen.getByLabelText(/Email/i)
        const passwordInput = screen.getByLabelText(/Password/i)
        const submitButton = screen.getByRole('button', { name: /LOG IN/ })

        // Empty submission
        await act(() => {
            fireEvent.click(submitButton)
        })
        expect(screen.getAllByText(/This field is required/).length === 2)

        // Invalid email and password
        const invalidEmail = 'test'
        const invalidPassword = '123'
        await act(() => {
            fireEvent.change(emailInput, { target: { value: invalidEmail } })
            fireEvent.change(passwordInput, { target: { value: invalidPassword } })
        })
        expect(screen.getByText(/Invalid email address/)).toBeInTheDocument()
        expect(emailInput).toHaveValue(invalidEmail)  // email should not be cleared
        expect(screen.getByText(/Password must be at least 8 characters long/)).toBeInTheDocument()
    })

    test('loads sign up page', async () => {
        await renderPath('/login')
        const signUpLink = screen.getByRole('link', { name: /Sign up/ })
        await act(() => {
            fireEvent.click(signUpLink)
        })
        await finishLoading()  // wait for js code load (code-splitting)
        expect(screen.getByText(/SIGN UP/)).toBeInTheDocument()
    })

    test('loads password reset page', async () => {
        await renderPath('/login')
        const forgotPasswordLink = screen.getByRole('link', { name: /Forgot password?/ })
        await act(() => {
            fireEvent.click(forgotPasswordLink)
        })
        await finishLoading()  // wait for js code load (code-splitting)
        expect(screen.getByText(/Password reset/)).toBeInTheDocument()
    })

    test('shows error message on auth failure', async () => {
        const server = setupServer(
            http.post(`${VITE_BACKEND_URL}/auth/users/login/`, async ({ request }) => {
                const body = await request.json()
                if (body.email === testEmail && body.password === testPassword) {
                    return HttpResponse.json(accessTokenResponse, { status: 200 })
                }
                else {
                    return HttpResponse.json(authErrorResponse, { status: 401 })
                }
            }),
        )
        server.listen()

        await renderPath('/login')
        const emailInput = screen.getByLabelText(/Email/i)
        const passwordInput = screen.getByLabelText(/Password/i)
        const submitButton = screen.getByRole('button', { name: /LOG IN/ })

        await act(() => {
            fireEvent.change(emailInput, { target: { value: testEmail } })
            fireEvent.change(passwordInput, { target: { value: testPassword + 'abc' } })  // wrong password
            fireEvent.click(submitButton)
        })

        expect(screen.getByText(/Incorrect email or password!/)).toBeInTheDocument()
        expect(screen.getByText(/Login/)).toBeInTheDocument()
        server.close()
    })

    test('redirect to floodmaps on auth success', async () => {
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
            // Should redirect to floodmaps and make call to get floodmap data
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

        await finishLoading()
        expect(screen.getByText(floodmapsResponse.results[0].name)).toBeInTheDocument()
        expect(screen.queryByText(/Login/)).toBeNull()  // User is already logged in => log in button is NOT shown!

        server.close()
    })
})
