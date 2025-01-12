import '@testing-library/jest-dom'
import { screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, describe, vi } from 'vitest'
import { renderPath, finishLoading } from '@testing/helpers'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { floodmaps_page_1, floodmaps_page_2 } from './testData'
import { succeededJob } from '../../Details/__tests__/testData'


const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL

describe('PublicFloodmaps component', () => {

    test('renders correctly', async () => {
        const server = setupServer(
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/`, ({ request }) => {
                const url = new URL(request.url)
                const page = url.searchParams.get('page')
                if (page === null || page === '1') {
                    return HttpResponse.json(floodmaps_page_1)
                }
                if (page === '2') {
                    return HttpResponse.json(floodmaps_page_2)
                }
            }),
        )
        server.listen()
        await renderPath(`/floodmaps`)
        await finishLoading()  // wait for loader to return
        // Assert the info of the first and last floodmaps are displayed.
        expect(screen.getByText(/^Test Flood 1$/)).toBeInTheDocument()
        expect(screen.getByText(/^37.901$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.601$/)).toBeInTheDocument()
        expect(screen.getByText(/^38.001$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.801$/)).toBeInTheDocument()
        expect(screen.getByText(/^01\/10\/2024$/)).toBeInTheDocument()
        expect(screen.getByText(/^1 Oct, 2024 00:00$/)).toBeInTheDocument()

        expect(screen.getByText(/^Test Flood 12$/)).toBeInTheDocument()
        expect(screen.getByText(/^37.912$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.612$/)).toBeInTheDocument()
        expect(screen.getByText(/^38.012$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.812$/)).toBeInTheDocument()
        expect(screen.getByText(/^12\/10\/2024$/)).toBeInTheDocument()
        expect(screen.getByText(/^12 Oct, 2024 00:00$/)).toBeInTheDocument()

        // But all floodmaps are displayed.
        expect(screen.getAllByText(/Latitude/).length === 12)
        expect(screen.getAllByText(/Longitude/).length === 12)
        expect(screen.getAllByText(/Built At/).length === 12)

        // Load next page
        const page2Button = screen.getByRole('button', { name: /2/ })
        await act(() => {
            fireEvent.click(page2Button)
        })

        // page 2 floodmaps
        expect(screen.getByText(/^Test Flood 13$/)).toBeInTheDocument()
        expect(screen.getByText(/^37.913$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.613$/)).toBeInTheDocument()
        expect(screen.getByText(/^38.013$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.813$/)).toBeInTheDocument()
        expect(screen.getByText(/^13\/10\/2024$/)).toBeInTheDocument()
        expect(screen.getByText(/^13 Oct, 2024 00:00$/)).toBeInTheDocument()

        expect(screen.getByText(/^Test Flood 16$/)).toBeInTheDocument()
        expect(screen.getByText(/^37.916$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.616$/)).toBeInTheDocument()
        expect(screen.getByText(/^38.016$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.816$/)).toBeInTheDocument()
        expect(screen.getByText(/^16\/10\/2024$/)).toBeInTheDocument()
        expect(screen.getByText(/^16 Oct, 2024 00:00$/)).toBeInTheDocument()

        expect(screen.getAllByText(/Latitude/).length === 4)
        expect(screen.getAllByText(/Longitude/).length === 4)
        expect(screen.getAllByText(/Built At/).length === 4)
        server.close()
    })

    test('redirects to the floodmap page', async () => {
        const floodmap_id = 2   // The floodmap to click.
        const server = setupServer(
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/`, () => {
                return HttpResponse.json(floodmaps_page_1)
            }),
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/${floodmap_id}`, () => {
                return HttpResponse.json(succeededJob)
            }),
        )
        server.listen()
        await renderPath(`/floodmaps`)
        await finishLoading()
        const floodmapTitle = screen.getByText(new RegExp(`Test Flood ${floodmap_id}`))
        await act(() => {
            fireEvent.click(floodmapTitle)
        })
        // Floodmap loaded is successful and thus the layer controls are displayed.
        expect(screen.queryByLabelText(/Area of Interest/)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/ESA WorldCover 2021/)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Sentinel-1 Backscatter/)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/T-scores/)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Flooded Regions/)).not.toBeInTheDocument()
        server.close()
    })

    test('applies filters', async () => {
        const nameFilter = 'Test Flood'
        const maxLatFilter = '50.123'
        const fromDateFilter = '31/10/2021'
        const server = setupServer(
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/`, ({ request }) => {
                const url = new URL(request.url)
                const nameParam = url.searchParams.get('flood_name')
                const maxLatParam = url.searchParams.get('max_lat')
                const fromDateParam = url.searchParams.get('from_date')
                if (nameParam === null && maxLatParam === null && fromDateParam === null) {
                    return HttpResponse.json(floodmaps_page_1)
                }
                if (nameParam === nameFilter && maxLatParam === maxLatFilter && fromDateParam === fromDateFilter) {
                    return HttpResponse.json(floodmaps_page_2)
                }
            }),
        )
        // Need to mock DatePicker import so that is returns the desktop version in which the date
        // can be set with an event.
        vi.mock('@mui/x-date-pickers/DatePicker', async () => {
            const { DesktopDatePicker } = await import('@mui/x-date-pickers/DesktopDatePicker')
            return {
                DatePicker: DesktopDatePicker,
            }
        })
        server.listen()
        await renderPath(`/floodmaps`)
        await finishLoading()  // wait for loader to return

        const nameFilterInput = screen.getByPlaceholderText("Flood name")
        fireEvent.change(nameFilterInput, { target: { value: 'a' } })
        const searchButton = screen.getByRole("button", { name: "search" })
        await act(() => {
            fireEvent.click(searchButton)
        })
        expect(screen.getByText(/The flood name must contain at least/)).toBeInTheDocument()
        fireEvent.change(nameFilterInput, { target: { value: nameFilter } })
        const toggleFilterOptionsButton = screen.getByRole("button", { name: "filters" })
        await act(() => {
            fireEvent.click(toggleFilterOptionsButton)
        })
        const areaFilterButton = screen.getByRole("button", { name: "AREA" })
        await act(() => {
            fireEvent.click(areaFilterButton)
        })
        const maxLatFilterInput = screen.getByPlaceholderText("Max Lat.")
        fireEvent.change(maxLatFilterInput, { target: { value: 9999 } })
        await act(() => {
            fireEvent.click(searchButton)
        })
        expect(screen.getByText(/Latitude must be less than or equal to 90/)).toBeInTheDocument()
        fireEvent.change(maxLatFilterInput, { target: { value: maxLatFilter } })
        const dateFilterButton = screen.getByRole("button", { name: "DATE" })
        await act(() => {
            fireEvent.click(dateFilterButton)
        })
        let fromDateFilterInput = screen.getByPlaceholderText("From date")
        // Need to use userEvent for DatePicker.
        const user = userEvent.setup()
        await user.type(fromDateFilterInput, '31/10/3022')
        await act(async () => {
            fireEvent.click(searchButton)
        })
        expect(screen.getByText(/The date cannot be in the future/)).toBeInTheDocument()
        await user.type(fromDateFilterInput, fromDateFilter)
        await act(() => {
            fireEvent.click(searchButton)
        })
        // Applying filters returns page 2
        expect(screen.getByText(/^Test Flood 13$/)).toBeInTheDocument()
        expect(screen.getByText(/^37.913$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.613$/)).toBeInTheDocument()
        expect(screen.getByText(/^38.013$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.813$/)).toBeInTheDocument()
        expect(screen.getByText(/^13\/10\/2024$/)).toBeInTheDocument()
        expect(screen.getByText(/^13 Oct, 2024 00:00$/)).toBeInTheDocument()

        expect(screen.getByText(/^Test Flood 16$/)).toBeInTheDocument()
        expect(screen.getByText(/^37.916$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.616$/)).toBeInTheDocument()
        expect(screen.getByText(/^38.016$/)).toBeInTheDocument()
        expect(screen.getByText(/^23.816$/)).toBeInTheDocument()
        expect(screen.getByText(/^16\/10\/2024$/)).toBeInTheDocument()
        expect(screen.getByText(/^16 Oct, 2024 00:00$/)).toBeInTheDocument()

        expect(screen.getAllByText(/Latitude/).length === 4)
        expect(screen.getAllByText(/Longitude/).length === 4)
        expect(screen.getAllByText(/Built At/).length === 4)
    })
})
