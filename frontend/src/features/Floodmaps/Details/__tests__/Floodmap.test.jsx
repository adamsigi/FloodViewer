import '@testing-library/jest-dom'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { test, expect, describe, vi } from 'vitest'
import { renderPath, finishLoading, createMatchMedia } from '@testing/helpers'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { failedJob, progressingJob, succeededJob } from './testData'
import { createJobUpdatesWebSocketMock } from '@testing/helpers'

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL

describe('Floodmap component', () => {

    test('job progress renders correctly', async () => {
        const floodmapId = 1
        const server = setupServer(
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/${floodmapId}`, () => {
                return HttpResponse.json(failedJob)
            }),
        )
        server.listen()
        await renderPath(`/floodmaps/${floodmapId}`)
        await finishLoading()  // wait for loader to return
        expect(screen.getByText(/Latitude/)).toBeInTheDocument()
        expect(screen.getByText(/Latitude/)).toBeInTheDocument()
        // Lat/Lng from test data.
        expect(screen.getByText(/37.923/)).toBeInTheDocument()
        expect(screen.getByText(/23.622/)).toBeInTheDocument()
        expect(screen.getByText(/38.019/)).toBeInTheDocument()
        expect(screen.getByText(/23.842/)).toBeInTheDocument()
        expect(screen.getByText(/Floodpy Job Status/)).toBeInTheDocument()
        expect(screen.getByText(/Your request to run Floodpy has been submitted but encountered an /)).toBeInTheDocument()
        expect(screen.getByText(/Downloading precipitation data/)).toBeInTheDocument()
        expect(screen.getByText(/Classifying floodwater/)).toBeInTheDocument()
        expect(screen.getByText(/Testing something went wrong/)).toBeInTheDocument()
        server.close()
    })

    test('job progress updates and shows error trace', async () => {
        const floodmapId = 2
        const server = setupServer(
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/${floodmapId}`, () => {
                return HttpResponse.json(progressingJob)
            }),
        )
        server.listen()
        vi.stubGlobal('WebSocket', createJobUpdatesWebSocketMock(true))  // mock update for failed job
        await renderPath(`/floodmaps/${floodmapId}`)
        await finishLoading()
        expect(screen.getByText(/37.923/)).toBeInTheDocument()
        expect(screen.getByText(/23.622/)).toBeInTheDocument()
        expect(screen.getByText(/38.019/)).toBeInTheDocument()
        expect(screen.getByText(/23.842/)).toBeInTheDocument()
        expect(screen.getByText(/Floodpy Job Status/)).toBeInTheDocument()
        expect(screen.getByText(/Your request to run Floodpy has been submitted and is now in/)).toBeInTheDocument()
        await waitFor(() => {
            // Last mocked job update has "failed" status and an error trace.
            // Expected to change the description slightly and display the error trace. 
            expect(screen.getByText(/Your request to run Floodpy has been submitted but encountered an /)).toBeInTheDocument()
            expect(screen.getByText(/Failed trace for testing/)).toBeInTheDocument()
        }, {'timeout': 1000 })
        vi.restoreAllMocks()
        server.close()
    })

    test('job progress transitions to floodmap display', async () => {
        const floodmapId = 2
        let isFirstCall = true
        const server = setupServer(
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/${floodmapId}`, () => {
                if (isFirstCall) {
                    isFirstCall = false
                    return HttpResponse.json(progressingJob)
                }
                else {
                    return HttpResponse.json(succeededJob)
                }
            }),
        )
        // Drawing Rectangle on the map with leaflet fails on test env thus we mock it.
        vi.mock('react-leaflet/Rectangle', () => ({
            Rectangle: vi.fn(() => null)
        }))
        server.listen()
        vi.stubGlobal('WebSocket', createJobUpdatesWebSocketMock())  // mock update for succeeded job
        await renderPath(`/floodmaps/${floodmapId}`)
        await finishLoading()
        expect(screen.getByText(/37.923/)).toBeInTheDocument()
        expect(screen.getByText(/23.622/)).toBeInTheDocument()
        expect(screen.getByText(/38.019/)).toBeInTheDocument()
        expect(screen.getByText(/23.842/)).toBeInTheDocument()
        expect(screen.getByText(/Floodpy Job Status/)).toBeInTheDocument()
        expect(screen.getByText(/Your request to run Floodpy has been submitted and is now in/)).toBeInTheDocument()
        await waitFor(() => {
            expect(screen.getByLabelText(/Area of Interest/)).toBeInTheDocument()
            expect(screen.getByLabelText(/ESA WorldCover 2021/)).toBeInTheDocument()
            expect(screen.getByLabelText(/Sentinel-1 Backscatter/)).toBeInTheDocument()
            expect(screen.getByLabelText(/T-scores/)).toBeInTheDocument()
            expect(screen.getByLabelText(/Flooded Regions/)).toBeInTheDocument()
        }, { 'timeout': 1000 })
        server.close()
    })

    test('floodmap display renders correctly - large screen', async () => {
        const floodmapId = 2
        const server = setupServer(
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/${floodmapId}`, () => {
                return HttpResponse.json(succeededJob)

            }),
        )
        // Drawing Rectangle on the map with leaflet fails on test env thus we mock it.
        vi.mock('react-leaflet/Rectangle', () => ({
            Rectangle: vi.fn(() => null)
        }))
        server.listen()
        await renderPath(`/floodmaps/${floodmapId}`)
        await finishLoading()
        expect(screen.getByText(/Latitude/)).toBeInTheDocument()
        expect(screen.getByText(/Longitude/)).toBeInTheDocument()
        expect(screen.getByText(/Built At/)).toBeInTheDocument()
        expect(screen.getByText(/37.923/)).toBeInTheDocument()
        expect(screen.getByText(/23.622/)).toBeInTheDocument()
        expect(screen.getByText(/38.019/)).toBeInTheDocument()
        expect(screen.getByText(/23.842/)).toBeInTheDocument()
        expect(screen.queryByText(/Floodpy Job Status/)).not.toBeInTheDocument()  // job progress panel not visible
        const AreaOfInterestCheckbox = screen.getByLabelText(/Area of Interest/)
        const ESAWorldCoverCheckbox = screen.getByLabelText(/ESA WorldCover 2021/)
        const SentinelCheckbox = screen.getByLabelText(/Sentinel-1 Backscatter/)
        const tScoresCheckbox = screen.getByLabelText(/T-scores/)
        const FloodedRegionsCheckbox = screen.getByLabelText(/Flooded Regions/)

        expect(AreaOfInterestCheckbox.checked).toBeTruthy()
        expect(ESAWorldCoverCheckbox.checked).toBeFalsy()
        expect(SentinelCheckbox.checked).toBeFalsy()
        expect(tScoresCheckbox.checked).toBeFalsy()
        expect(FloodedRegionsCheckbox.checked).toBeTruthy()

        fireEvent.click(ESAWorldCoverCheckbox)
        expect(screen.getByText(/ESA WorldCover 2021 Categories/)).toBeInTheDocument()
        fireEvent.click(ESAWorldCoverCheckbox)
        expect(screen.queryByText(/ESA WorldCover 2021 Categories/)).not.toBeInTheDocument()

        fireEvent.click(SentinelCheckbox)
        expect(screen.getByText(/Backscatter coefficient VV \(db\)/)).toBeInTheDocument()
        fireEvent.click(SentinelCheckbox)
        expect(screen.queryByText(/Backscatter coefficient VV \(db\)/)).not.toBeInTheDocument()

        fireEvent.click(tScoresCheckbox)
        expect(screen.getByText(/T-scores \(changes\)/)).toBeInTheDocument()
        fireEvent.click(tScoresCheckbox)
        expect(screen.queryByText(/T-scores \(changes\)/)).not.toBeInTheDocument()

        server.close()
    })

    test('floodmap display renders correctly - small screen', async () => {
        window.matchMedia = createMatchMedia(390)  // small screen
        const floodmapId = 2
        const server = setupServer(
            http.get(`${VITE_BACKEND_URL}/api/floodmaps/${floodmapId}`, () => {
                return HttpResponse.json(succeededJob)

            }),
        )
        // Drawing Rectangle on the map with leaflet fails on test env thus we mock it.
        // vi.mock('react-leaflet/Rectangle', () => ({
        //     Rectangle: vi.fn(() => null)
        // }))
        server.listen()
        await renderPath(`/floodmaps/${floodmapId}`)
        await finishLoading()
        expect(screen.getByText(/Latitude/)).toBeInTheDocument()
        expect(screen.getByText(/Longitude/)).toBeInTheDocument()
        expect(screen.getByText(/Built At/)).toBeInTheDocument()
        expect(screen.getByText(/37.923/)).toBeInTheDocument()
        expect(screen.getByText(/23.622/)).toBeInTheDocument()
        expect(screen.getByText(/38.019/)).toBeInTheDocument()
        expect(screen.getByText(/23.842/)).toBeInTheDocument()
        expect(screen.queryByText(/Floodpy Job Status/)).not.toBeInTheDocument()  // job progress panel not visible
        const AreaOfInterestCheckbox = screen.getByLabelText(/Area of Interest/)
        const ESAWorldCoverCheckbox = screen.getByLabelText(/ESA WorldCover 2021/)
        const SentinelCheckbox = screen.getByLabelText(/Sentinel-1 Backscatter/)
        const tScoresCheckbox = screen.getByLabelText(/T-scores/)
        const FloodedRegionsCheckbox = screen.getByLabelText(/Flooded Regions/)

        expect(AreaOfInterestCheckbox.checked).toBeTruthy()
        expect(ESAWorldCoverCheckbox.checked).toBeFalsy()
        expect(SentinelCheckbox.checked).toBeFalsy()
        expect(tScoresCheckbox.checked).toBeFalsy()
        expect(FloodedRegionsCheckbox.checked).toBeTruthy()

        // No legends are rendered on extra small screens 
        fireEvent.click(ESAWorldCoverCheckbox)
        expect(screen.queryByText(/ESA WorldCover 2021 Categories/)).not.toBeInTheDocument()
        fireEvent.click(ESAWorldCoverCheckbox)

        fireEvent.click(SentinelCheckbox)
        expect(screen.queryByText(/Backscatter coefficient VV \(db\)/)).not.toBeInTheDocument()
        fireEvent.click(SentinelCheckbox)

        fireEvent.click(tScoresCheckbox)
        expect(screen.queryByText(/T-scores \(changes\)/)).not.toBeInTheDocument()
        fireEvent.click(tScoresCheckbox)

        const layersControlToggleButton = screen.getByTestId('layers-control-toggle')
        fireEvent.click(layersControlToggleButton)

        expect(screen.queryByLabelText(/Area of Interest/)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/ESA WorldCover 2021/)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Sentinel-1 Backscatter/)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/T-scores/)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/Flooded Regions/)).not.toBeInTheDocument()
        
        server.close()
    })
})
