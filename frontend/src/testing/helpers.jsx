import { render, waitFor, screen } from '@testing-library/react'
import { routes } from '../routing/routers'
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { expect } from 'vitest'
import mediaQuery from "css-mediaquery"

const VITE_BACKEND_WS_URL = import.meta.env.VITE_BACKEND_WS_URL


export async function finishLoading() {
    await waitFor(() => {
        expect(screen.queryByTestId('loading-screen')).not.toBeInTheDocument();
    })
}


export async function renderPath(path) {
    const router = createMemoryRouter(routes, {
        initialEntries: [path],
    })
    const result = render(<RouterProvider router={router} />)
    await finishLoading()
    return result
}


// Simulate screen with given width.
// https://mui.com/material-ui/react-use-media-query/#testing
export function createMatchMedia(width) {
    function matchMedia(query) {
        return {
            matches: mediaQuery.match(query, { width }),
            addListener: () => { },
            removeListener: () => { }
        }
    }
    return matchMedia
}


export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export function createJobUpdatesWebSocketMock(toFail = false) {
    return class JobUpdatesWebSocketMock {
        constructor(url) {
            const urlRegex = new RegExp(`${VITE_BACKEND_WS_URL}/ws/api/floodmaps/\\d+/updates/`)
            if (url.match(urlRegex)) {
                this.url = url
                this.connected = true
            }
            else {
                this.connected = false
            }
        }
        addEventListener(type, listener) {
            if (type === 'message') {
                const updates = [
                    { "status": "Progressing", "stage": "Pending approval" },
                    { "status": "Progressing", "stage": "Waiting in queue" },
                    { "status": "Progressing", "stage": "Downloading precipitation data" },
                    { "status": "Progressing", "stage": "Downloading Sentinel-1 images" },
                    { "status": "Progressing", "stage": "Preprocessing Sentinel-1 images" },
                    { "status": "Progressing", "stage": "Performing statistical analysis" },
                    { "status": "Progressing", "stage": "Classifying floodwater" },
                    { "status": "Progressing", "stage": "Committing results" },
                ]
                if (toFail) {
                    updates.push({ "status": "Failed", "stage": "Committing results", "error_trace": "Failed trace for testing" })
                }
                else {
                    updates.push({ "status": "Succeeded", "stage": "Completed" })
                }
                setTimeout(() => {
                    updates.forEach((update) => {
                        listener({ 'data': JSON.stringify(update) })
                    })
                }, 500)
            }
        }
        close() {
            this.connected = false
        }
    }
}
