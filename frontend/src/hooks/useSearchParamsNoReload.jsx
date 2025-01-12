/**
 * Update search parameters WITHOUT reloading the page.
 */
export default function useSearchParamsNoReload() {

    function getSearchParamsNoReload(param) {
        const url = new URL(window.location)
        if (param === undefined) {
            return url.search
        }
        return url.searchParams.get(param)
    }

    function setSearchParamsNoReload(params, append=false) {
        const url = new URL(window.location)
        const currentParams = Object.fromEntries(url.searchParams.entries())
        if (JSON.stringify(params) === JSON.stringify(currentParams)) {
            return false  // No change
        }
        if (!append) url.search = ''  // To allow removal of search params.
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value)
        }
        history.pushState(null, '', url)
        return true
    }

    return [getSearchParamsNoReload, setSearchParamsNoReload]
}
