import jwt from 'jsonwebtoken'

export const testEmail = 'test@test.com'
export const testPassword = 'S21asdfghnb'
export const testPasswordNew = 'S21asdfghnba'

export const accessTokenResponse = {
    "access": jwt.sign({
        exp: Math.floor(Date.now() / 1000) + 60 * 10,  // expires in 10 mins
        data: 'foobar'
    }, 'secret')
}

export const floodmapsResponse = {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 27,
            "name": "Test Flood",
            "bbox": {
                "min_lat": 37.923,
                "min_lng": 23.623,
                "max_lat": 38.019,
                "max_lng": 23.842
            },
            "flood_date": "2024-10-14T00:00:00Z",
            "days_before_flood": 30,
            "days_after_flood": 2,
            "job": {
                "status": "Succeeded",
                "stage": "Completed",
                "posted_at": "2024-10-15T18:31:44.878827Z"
            },
            "product": {
                "built_at": "2024-10-15T18:31:52.387071Z",
                "geoserver_workspace": "floodmap_27",
                "esa_world_cover_layer": "esa_world_cover_layer_27",
                "s1_backscatter_layer": "s1_backscatter_layer_27",
                "t_score_layer": "t_score_layer_27",
                "flooded_regions_layer": "flooded_regions_layer_27",
                "thumbnail_url_params": "service=WMS&version=1.1.0&request=GetMap&layers=thumbnail_layer_group_27&bbox=22.192223152509055,39.53810734388033,22.32408228671482,39.6735102846045&width=747&height=768&srs=EPSG:4326&format=image/png",
                "land_cover_categories": [
                    0,
                    10,
                    20,
                    30,
                    40,
                    50,
                    60,
                    80
                ],
                "s1_backscatter_quantiles": [
                    -15,
                    0
                ],
                "t_score_quantiles": [
                    -16,
                    79
                ]
            }
        }
    ]
}

export const failedAuthResponse = {
    "detail": "No active account found with the given credentials"
}

export const emailAlreadyInUseResponse = {
    email: ["flood viewer user with this email already exists."]
}

export const authErrorResponse = {
    "detail": "No active account found with the given credentials"
}

export const signUpSuccessResponse = {
    "email": testEmail,
    "id": 42
}

export const testUID = '123'
export const testToken = 'abc'

export const failedPasswordResetResponse = {
    "uid": [
        "Invalid user id or user doesn't exist."
    ]
}

export const invalidPasswordResponse = {
    "current_password": [
        "Invalid password."
    ]
}

export const invalidEmailResponse = {
    "email": [
        "Enter a valid email address."
    ]
}

export const successfulLogoutResponse = {
    "detail": "Successfully logged out"
}