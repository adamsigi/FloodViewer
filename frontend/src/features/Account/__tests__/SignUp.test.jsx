import { screen, fireEvent, act, } from '@testing-library/react'
import { test, expect, describe, } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { renderPath, finishLoading } from '@testing/helpers'
import { emailAlreadyInUseResponse, signUpSuccessResponse, testEmail, testPassword } from './testData'

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


describe('SignUp component', () => {

    test('renders correctly', async () => {
        await renderPath('/signup')
        expect(screen.getByRole('button', { name: /SIGN UP/ })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /Log in/ })).toBeInTheDocument()
        expect(screen.getByText(/Sign up/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
        expect(screen.getByLabelText(/^Password/)).toBeInTheDocument()
        expect(screen.getByLabelText(/^Confirm Password/)).toBeInTheDocument()
    })

    test('shows error message on bad input', async () => {
        await renderPath('/signup')
        const emailInput = screen.getByLabelText(/Email/)
        const passwordInput = screen.getByLabelText(/^Password/)
        const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/)
        const submitButton = screen.getByRole('button', { name: /SIGN UP/ })

        // Empty submission
        await act(() => {
            fireEvent.click(submitButton)
        })
        expect(screen.getAllByText(/This field is required/).length === 3)

        // Invalid email, password, and confirm password
        await act(() => {
            fireEvent.change(emailInput, { target: { value: 'test' } })
            fireEvent.change(passwordInput, { target: { value: '123' } })
            fireEvent.change(confirmPasswordInput, { target: { value: '1234' } })
        })
        expect(screen.getByText(/Invalid email address/)).toBeInTheDocument()
        expect(screen.getByText(/Password must be at least 8 characters long/)).toBeInTheDocument()
        expect(screen.getByText(/Passwords do not match/)).toBeInTheDocument()
    })

    test('loads log in page', async () => {
        await renderPath('/signup')
        const signUpLink = screen.getByRole('link', { name: /Log in/ })
        await act(() => {
            fireEvent.click(signUpLink)
        })
        await finishLoading()  // wait for js code load (code-splitting)
        expect(screen.getByText(/LOG IN/)).toBeInTheDocument()
    })

    test('shows error message on already used email', async () => {
        const server = setupServer(
            http.post(`${VITE_BACKEND_URL}/auth/users/`, async ({ request }) => {
                const body = await request.json()
                if (body.email === testEmail && body.password === testPassword && body.re_password === testPassword) {
                    return HttpResponse.json(emailAlreadyInUseResponse, { status: 400 })
                }
                else {
                    return HttpResponse.json(signUpSuccessResponse, { status: 201 })
                }
            }),
        )
        server.listen()

        await renderPath('/signup')
        const emailInput = screen.getByLabelText(/Email/)
        const passwordInput = screen.getByLabelText(/^Password/)
        const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/)
        const submitButton = screen.getByRole('button', { name: /SIGN UP/ })

        await act(() => {
            fireEvent.change(emailInput, { target: { value: testEmail } })
            fireEvent.change(passwordInput, { target: { value: testPassword } })
            fireEvent.change(confirmPasswordInput, { target: { value: testPassword } })
            fireEvent.click(submitButton)
        })

        expect(screen.getByText(/Email already in use/)).toBeInTheDocument()
        server.close()
    })

    test('shows validation message on success', async () => {
        const server = setupServer(
            http.post(`${VITE_BACKEND_URL}/auth/users/`, async ({ request }) => {
                const body = await request.json()
                if (body.email === testEmail && body.password === testPassword && body.re_password === testPassword) {
                    return HttpResponse.json(signUpSuccessResponse, { status: 201 })
                }
                else {
                    return HttpResponse.json(emailAlreadyInUseResponse, { status: 400 })
                }
            }),
        )
        server.listen()

        await renderPath('/signup')
        const emailInput = screen.getByLabelText(/Email/)
        const passwordInput = screen.getByLabelText(/^Password/)
        const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/)
        const submitButton = screen.getByRole('button', { name: /SIGN UP/ })

        await act(() => {
            fireEvent.change(emailInput, { target: { value: testEmail } })
            fireEvent.change(passwordInput, { target: { value: testPassword } })
            fireEvent.change(confirmPasswordInput, { target: { value: testPassword } })
            fireEvent.click(submitButton)
        })

        expect(screen.getByText(/Verification Email Sent!/)).toBeInTheDocument()
        server.close()
    })
})
