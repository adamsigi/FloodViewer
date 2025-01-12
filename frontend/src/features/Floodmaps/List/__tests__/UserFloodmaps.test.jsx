import '@testing-library/jest-dom'
import { screen, fireEvent, act } from '@testing-library/react'
import { test, expect, describe, } from 'vitest'
import { renderPath, finishLoading, createMatchMedia } from '@testing/helpers'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { floodmaps_page_1, progressing_and_failed_floodmaps, } from './testData'
import { accessTokenResponse, failedAuthResponse, testEmail, testPassword } from '../../../Account/__tests__/testData'

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL

describe('UserFloodmaps display', () => {

    test('renders correctly', async () => {
        // The grid display of floodmaps will not be tested since the component that renders it 
        // (FloodmapsDisplay.jsx) is already tested in PublicFloodmaps.test.jsx

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
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/`, ({ request }) => {
                const url = new URL(request.url)
                const succeeded = url.searchParams.get('succeeded')
                const progressing = url.searchParams.get('progressing')
                const failed = url.searchParams.get('failed')

                if (succeeded === 'false' && progressing === 'true' && failed === 'true') {
                    return HttpResponse.json(progressing_and_failed_floodmaps)
                }
                else {
                    return HttpResponse.json(floodmaps_page_1)
                }
            }),
        )
        server.listen()

        // Login and navigate to jobs
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
        const jobsButton = screen.getByRole('menuitem', { name: /Jobs/ })
        await act(() => {
            fireEvent.click(jobsButton)
        })
        await finishLoading()

        expect(screen.getByText(/^Test Flood 1$/)).toBeInTheDocument()
        expect(screen.getByText(/^Test Flood 2$/)).toBeInTheDocument()
        expect(screen.getByText(/^Test Flood 11$/)).toBeInTheDocument()
        expect(screen.getByText(/^Test Flood 12$/)).toBeInTheDocument()

        expect(screen.getAllByText(/Latitude/).length === 12)
        expect(screen.getAllByText(/Longitude/).length === 12)
        expect(screen.getAllByText(/Built At/).length === 12)

        const succeededCheckbox = screen.getByLabelText(/Succeeded/)
        const progressingCheckbox = screen.getByLabelText(/Progressing/)
        const failedCheckbox = screen.getByLabelText(/Failed/)

        expect(succeededCheckbox.checked).toBeTruthy()
        expect(progressingCheckbox.checked).toBeTruthy()
        expect(failedCheckbox.checked).toBeTruthy()

        await act(() => {
            fireEvent.click(succeededCheckbox)
        })

        expect(screen.getByText(/^Test Flood 17$/)).toBeInTheDocument()
        expect(screen.getByText(/^Test Flood 18$/)).toBeInTheDocument()

        // Card headings for failed and progressing floodmaps (jobs)
        expect(screen.getByRole("heading", { level: 5, name: "Failed" })).toBeInTheDocument()
        expect(screen.getByRole("heading", { level: 5, name: "Progressing" })).toBeInTheDocument()

        server.close()
    })
})
