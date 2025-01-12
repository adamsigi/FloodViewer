import { expect, afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from "@testing-library/jest-dom/matchers"
import { createMatchMedia, } from '@testing/helpers'

expect.extend(matchers)

beforeEach(() => {
    // Large screen by default.
    window.matchMedia = createMatchMedia(1920)
})

afterEach(() => {
    cleanup()
    localStorage.clear()
})
