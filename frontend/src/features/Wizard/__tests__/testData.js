
export function getMockedPOSTFloodmapResponse(requestBody, id = 1) {
    const { name, bbox, flood_date, days_before_flood, days_after_flood } = requestBody
    const posted_at = (new Date()).toISOString()
    return {
        "id": id,
        "name": name,
        "bbox": {
            "min_lat": bbox.min_lat,
            "min_lng": bbox.min_lng,
            "max_lat": bbox.max_lat,
            "max_lng": bbox.max_lng
        },
        "flood_date": `${flood_date}Z`,
        "days_before_flood": days_before_flood,
        "days_after_flood": days_after_flood,
        "job": {
            "status": "Progressing",
            "stage": "Waiting in queue",
            "posted_at": posted_at
        },
    }
}
