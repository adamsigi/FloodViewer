import '@testing-library/jest-dom'
import { screen, fireEvent, act, waitFor } from '@testing-library/react'
import { test, expect, describe, vi } from 'vitest'
import { renderPath, finishLoading, createMatchMedia, delay } from '@testing/helpers'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { getMockedPOSTFloodmapResponse } from './testData'
import { createJobUpdatesWebSocketMock } from '@testing/helpers'

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL

describe('Wizard component', () => {

    test('renders correctly - large screen', async () => {
        await renderPath('/create')
        await finishLoading()  // wait for loader to return
        expect(screen.getByRole('button', { name: /CONTINUE/ })).toBeInTheDocument()
        expect(screen.getByText(/Navigate to the Flooded Region/)).toBeInTheDocument()
        expect(screen.getByText(/Please use the search functionality and interact/)).toBeInTheDocument()
        expect(screen.getByText(/Select the Area of Interest/)).toBeInTheDocument()
        expect(screen.getByText(/Enter Name and Datetime/)).toBeInTheDocument()
    })

    test('renders correctly - small screen', async () => {
        window.matchMedia = createMatchMedia(390)  // small screen
        await renderPath('/create')
        await finishLoading()  // wait for loader to return
        expect(screen.getByRole('button', { name: /CONTINUE/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /BACK/ })).toBeInTheDocument()
        expect(screen.getByText(/Navigate to the Flooded Region/)).toBeInTheDocument()
        expect(screen.getByText(/Select the Area of Interest/)).toBeInTheDocument()
        expect(screen.getByText(/Enter Name and Datetime/)).toBeInTheDocument()
    })

    test('progresses to step 2', async () => {
        await renderPath('/create')
        await finishLoading()  // wait for loader to return
        const continueButton = screen.getByRole('button', { name: /CONTINUE/ })
        await act(() => {
            fireEvent.click(continueButton)
        })
        // There are 2 continue buttons during the transition between steps.
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /CONTINUE/ })).toBeInTheDocument()
        )
        expect(screen.getByRole('button', { name: /BACK/ })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /EDIT/ })).toBeInTheDocument()  // BBoxEditor
    })

    test('applies edits to bbox', async () => {
        await renderPath('/create')
        await finishLoading()  // wait for loader to return
        const continueButton = screen.getByRole('button', { name: /CONTINUE/ })
        await act(() => {
            fireEvent.click(continueButton)
        })

        const editButton = screen.getByRole('button', { name: /EDIT/ })
        fireEvent.click(editButton)
        const cancelButton = screen.getByRole('button', { name: /CANCEL/ })
        const applyButton = screen.getByRole('button', { name: /APPLY/ })
        const maxLatInput = screen.getByLabelText(/Max Lat./)
        const existingMaxLat = maxLatInput.value

        // Invalid values are not allowed!
        const invalidLat = '9001'
        fireEvent.change(maxLatInput, { target: { value: invalidLat } })
        expect(screen.getByText(/Invalid BBox parameters/)).toBeInTheDocument()
        expect(applyButton).toBeDisabled()

        // Canceling restores the existing values.
        expect(maxLatInput.value).toEqual(invalidLat)
        fireEvent.click(cancelButton)
        expect(screen.queryByText(/Invalid BBox parameters/)).not.toBeInTheDocument()
        expect(maxLatInput.value).toEqual(existingMaxLat)

        // Applying changes the existing values.
        const validMaxLat = String(Number(existingMaxLat) + 40)
        fireEvent.click(editButton)
        fireEvent.change(maxLatInput, { target: { value: validMaxLat } })
        fireEvent.click(applyButton)
        expect(maxLatInput.value).toEqual(validMaxLat)
        expect(screen.queryByText(/and they must not exceed/)).not.toBeInTheDocument()  // bbox is too big! 
    })

    test('updates bbox when scrolling', async () => {
        await renderPath('/create')
        await finishLoading()  // wait for loader to return
        const continueButton = screen.getByRole('button', { name: /CONTINUE/ })
        await act(() => {
            fireEvent.click(continueButton)
        })
        const maxLatInput = screen.getByLabelText(/Max Lat./)
        const initialMaxLat = maxLatInput.value
        const attributionLink = screen.getByRole('link', { name: /Leaflet/ })
        await act(async () => {
            fireEvent.wheel(attributionLink, { deltaY: 1000 })
            await delay(500)  // Need to wait for scrolling animation.
        })
        const finalMaxLat = maxLatInput.value
        expect(finalMaxLat).not.toEqual(initialMaxLat)
    })

    test('progresses to step 3 and maintains bbox', async () => {
        await renderPath('/create')
        await finishLoading()  // wait for loader to return
        const step1ContinueButton = screen.getByRole('button', { name: /CONTINUE/ })
        await act(() => {
            fireEvent.click(step1ContinueButton)
        })
        let step2ContinueButton
        await waitFor(() =>
            step2ContinueButton = screen.getByRole('button', { name: /CONTINUE/ })
        )
        const editButton = screen.getByRole('button', { name: /EDIT/ })
        fireEvent.click(editButton)
        const applyButton = screen.getByRole('button', { name: /APPLY/ })
        const maxLat = '39.183'
        const minLat = '39.088'
        const maxLng = '22.546'
        const minLng = '22.327'
        fireEvent.change(screen.getByLabelText(/Max Lat./), { target: { value: maxLat } })
        fireEvent.change(screen.getByLabelText(/Min Lat./), { target: { value: minLat } })
        fireEvent.change(screen.getByLabelText(/Max Lng./), { target: { value: maxLng } })
        fireEvent.change(screen.getByLabelText(/Min Lng./), { target: { value: minLng } })
        fireEvent.click(applyButton)
        await act(() => {
            fireEvent.click(step2ContinueButton)
        })
        const backButton = screen.getByRole('button', { name: /BACK/ })
        fireEvent.click(backButton)

        expect(screen.getByLabelText(/Max Lat./).value).toEqual(maxLat)
        expect(screen.getByLabelText(/Min Lat./).value).toEqual(minLat)
        expect(screen.getByLabelText(/Max Lng./).value).toEqual(maxLng)
        expect(screen.getByLabelText(/Min Lng./).value).toEqual(minLng)
    })

    test('shows proper flood info form on step 3 and redirects on submission', async () => {
        // Need to mock DateTimePicker import so that is returns the desktop version in which the
        // datetime can be set with an event.
        vi.mock('@mui/x-date-pickers/DateTimePicker', async () => {
            const { DesktopDateTimePicker } = await import('@mui/x-date-pickers/DesktopDateTimePicker');
            return {
                DateTimePicker: DesktopDateTimePicker,
            }
        })
        await renderPath('/create')
        await finishLoading()  // wait for loader to return
        const step1ContinueButton = screen.getByRole('button', { name: /CONTINUE/ })
        await act(() => {
            fireEvent.click(step1ContinueButton)
        })
        let step2ContinueButton
        await waitFor(() =>
            step2ContinueButton = screen.getByRole('button', { name: /CONTINUE/ })
        )
        await act(() => {
            fireEvent.click(step2ContinueButton)
        })
        const submitButton = screen.getByRole('button', { name: /SUBMIT/ })
        const floodNameInput = screen.getByLabelText(/Flood name/)
        const floodDatetimeInput = screen.getByLabelText(/Flood datetime \(UTC\)/)
        const daysBeforeFloodInput = screen.getByLabelText(/Days before flood/)
        const daysAfterFloodInput = screen.getByLabelText(/Days after flood/)
        // Empty submit
        fireEvent.click(submitButton)
        let errorPrompts
        await waitFor(() => {
            errorPrompts = screen.getAllByText(/This field is required/)
        })
        expect(errorPrompts.length).toEqual(2)
        // Invalid submit
        await act(() => {
            fireEvent.change(floodNameInput, { target: { value: 'a' } })
            fireEvent.change(floodDatetimeInput, { target: { value: '31/10/3024 00:00' } })
            fireEvent.change(daysBeforeFloodInput, { target: { value: 12345 } })
            fireEvent.change(daysAfterFloodInput, { target: { value: 12345 } })
            fireEvent.click(submitButton)
        })
        await waitFor(() => {
            expect(screen.getByText(/The flood name must contain at least/)).toBeInTheDocument()
            expect(screen.getByText(/The flood event datetime \(in UTC\) cannot be in the future/)).toBeInTheDocument()
            expect(screen.getByText(/The number of days before the flood event cannot be greater than/)).toBeInTheDocument()
            expect(screen.getByText(/The number of days after the flood event cannot be greater than/)).toBeInTheDocument()
        })
        // Proper submit
        // Setup MSW to catch, check, and reply to the HTTP messages sent after proper submission.
        const floodmapId = 123
        let floodmapResponse
        const server = setupServer(
            http.post(`${VITE_BACKEND_URL}/api/floodmaps/`, async ({ request }) => {
                const body = await request.json()
                floodmapResponse = getMockedPOSTFloodmapResponse(body, floodmapId)
                return HttpResponse.json(floodmapResponse, { status: 201 })
            }),
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/${floodmapId}`, () => {
                return HttpResponse.json(floodmapResponse)
            }),
        )
        server.listen()
        // Mock websocket job updates.
        globalThis.WebSocket = createJobUpdatesWebSocketMock(true)  // mock update for failed job

        await act(() => {
            fireEvent.change(floodNameInput, { target: { value: 'Test Flood' } })
            fireEvent.change(floodDatetimeInput, { target: { value: '31/10/2022 00:00' } })
            fireEvent.change(daysBeforeFloodInput, { target: { value: 20 } })
            fireEvent.change(daysAfterFloodInput, { target: { value: 1 } })
            fireEvent.click(submitButton)
        })
        // Expected to redirect to the page of the new floodmap and open websocket for job updates.
        await waitFor(() => {
            expect(screen.getByText(/Latitude/)).toBeInTheDocument()
            expect(screen.getByText(/Longitude/)).toBeInTheDocument()
            expect(screen.getByText(/Floodpy Job Status/)).toBeInTheDocument()
            expect(screen.getByText(/Your request to run Floodpy has been submitted/)).toBeInTheDocument()
            expect(screen.getByText(/Downloading precipitation data/)).toBeInTheDocument()
            // Last mocked job update has failed status and error trace
            expect(screen.getByText(/Failed trace for testing/)).toBeInTheDocument()
        }, {'timeout': 1000 })
        server.close()
    })
})
