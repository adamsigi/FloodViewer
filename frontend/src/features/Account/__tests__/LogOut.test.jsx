import '@testing-library/jest-dom'
import { screen, fireEvent, act } from '@testing-library/react'
import { test, expect, describe, } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { renderPath } from '@testing/helpers'
import { accessTokenResponse, failedAuthResponse, floodmapsResponse, successfulLogoutResponse, testEmail, testPassword } from './testData'

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL


describe('Log out functionality', () => {

    test('redirect to login after log out', async () => {
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
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/`, () => {
                return HttpResponse.json(floodmapsResponse)
            }),
            http.post(`${VITE_BACKEND_URL}/auth/users/logout/`, async () => {
                return HttpResponse.json(successfulLogoutResponse, { status: 200 })
            }),
        )
        server.listen()

        // log in
        await renderPath('/login')
        const emailInput = screen.getByLabelText(/Email/i)
        const passwordInput = screen.getByLabelText(/Password/i)
        const submitButton = screen.getByRole('button', { name: /LOG IN/ })

        await act(() => {
            fireEvent.change(emailInput, { target: { value: testEmail } })
            fireEvent.change(passwordInput, { target: { value: testPassword } })
            fireEvent.click(submitButton)
        })

        // log out
        const userMenuButton = screen.getByTestId('AccountCircleIcon')
        await act(() => {
            fireEvent.click(userMenuButton)
        })
        const logoutButton = screen.getByRole('menuitem', { name: /Logout/ })
        await act(() => {
            fireEvent.click(logoutButton)
        })

        expect(screen.getByRole('button', { name: /LOG IN/ })).toBeInTheDocument()
        expect(screen.getByText(/Log in/)).toBeInTheDocument()
        server.close()
    })
})
