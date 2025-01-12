import * as yup from "yup"
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export const bBoxSchema = yup.object().shape({
    max_lat: yup
        .number()
        .notRequired()
        .typeError('Please enter a valid number')
        .min(-90, 'Latitude must be greater or equal to -90')
        .max(90, 'Latitude must be less than or equal to 90')
        .test('max-lat-greater-than-min-lat', 'Maximum latitude must be greater than minimum latitude', function (max_lat) {
            if (max_lat !== null && this.parent.min_lat !== null) {
                return max_lat > this.parent.min_lat
            }
            return true
        }),
    min_lat: yup
        .number()
        .notRequired()
        .typeError('Please enter a valid number')
        .min(-90, 'Latitude must be greater or equal to -90')
        .max(90, 'Latitude must be less than or equal to 90')
        .test('min-lat-less-than-max-lat', 'Minimum latitude must be less than maximum latitude', function (min_lat) {
            if (min_lat !== null && this.parent.max_lat !== null) {
                return min_lat < this.parent.max_lat
            }
            return true
        }),
    min_lng: yup
        .number()
        .notRequired()
        .typeError('Please enter a valid number')
        .min(-180, 'Longitude must be greater or equal to -180')
        .max(180, 'Longitude must be less than or equal to 180')
        .test('min-lng-less-than-max-lng', 'Minimum longitude must be less than maximum longitude', function (min_lng) {
            if (min_lng !== null && this.parent.max_lng !== null) {
                return min_lng < this.parent.max_lng
            }
            return true
        }),
    max_lng: yup
        .number()
        .notRequired()
        .typeError('Please enter a valid number')
        .min(-180, 'Longitude must be greater or equal to -180')
        .max(180, 'Longitude must be less than or equal to 180')
        .test('max-lng-greater-than-min-lng', 'Maximum longitude must be greater than minimum longitude', function (max_lng) {
            if (max_lng !== null && this.parent.min_lng !== null) {
                return max_lng > this.parent.min_lng
            }
            return true
        })
})


export const floodInfoSchema = yup.object().shape({
    flood_name: yup
        .string()
        .required('This field is required')
        .typeError('Please enter a valid name')
        .max(40, `The flood name is too long, please enter a shorter one`)
        .test('min-non-whitespace', `The flood name must contain at least ${3} non-space characters`, flood_name => {
            const nonSpaceCharCount = (flood_name || '').replace(/\s+/g, '').length
            return nonSpaceCharCount >= 3
        }),
    flood_datetime: yup
        .date()
        .required('This field is required')
        .typeError('Please enter a valid date')
        .min(new Date("2014-04-04T00:00:00"), 'The flood event datetime must be after 03/04/2014, which is the launch date of Sentinel-1')
        .max(new Date(dayjs().utcOffset(0, false).format('YYYY-MM-DDTHH:mm:ss')), 'The flood event datetime (in UTC) cannot be in the future'),
    days_before_flood: yup
        .number()
        .required('This field is required')
        .typeError('Please enter a valid number')
        .min(10, `The number of days before the flood event cannot be less than ${10}`)
        .max(60, `The number of days before the flood event cannot be greater than ${60}`),
    days_after_flood: yup
        .number()
        .required('This field is required')
        .typeError('Please enter a valid number')
        .min(1, `The number of days after the flood event cannot be less than ${1}`)
        .max(6, `The number of days after the flood event cannot be greater than ${6}`)
})


export const floodListFiltersSchema = yup.object().shape({
    flood_name: yup
        .string()
        .notRequired()
        .typeError('Please enter a valid name')
        .max(40, `The flood name is too long, please enter a shorter one`)
        .test('min-non-whitespace', `The flood name must contain at least ${2} non-space characters`, flood_name => {
            if (flood_name) {
                const nonSpaceCharCount = (flood_name || '').replace(/\s+/g, '').length
                return nonSpaceCharCount >= 2
            }
            return true
        }),
    max_lat: yup
        .number()
        .notRequired()
        .min(-90, 'Latitude must be greater or equal to -90')
        .max(90, 'Latitude must be less than or equal to 90')
        .test('max-lat-greater-than-min-lat', 'Maximum latitude must be greater than minimum latitude', function (max_lat) {
            if (max_lat !== null && this.parent.min_lat !== null) {
                return max_lat > this.parent.min_lat
            }
            return true
        }),
    min_lat: yup
        .number()
        .notRequired()
        .min(-90, 'Latitude must be greater or equal to -90')
        .max(90, 'Latitude must be less than or equal to 90')
        .test('min-lat-less-than-max-lat', 'Minimum latitude must be less than maximum latitude', function (min_lat) {
            if (min_lat !== null && this.parent.max_lat !== null) {
                return min_lat < this.parent.max_lat
            }
            return true
        }),
    min_lng: yup
        .number()
        .notRequired()
        .min(-180, 'Longitude must be greater or equal to -180')
        .max(180, 'Longitude must be less than or equal to 180')
        .test('min-lng-less-than-max-lng', 'Minimum longitude must be less than maximum longitude', function (min_lng) {
            if (min_lng !== null && this.parent.max_lng !== null) {
                return min_lng < this.parent.max_lng
            }
            return true
        }),
    max_lng: yup
        .number()
        .notRequired()
        .min(-180, 'Longitude must be greater or equal to -180')
        .max(180, 'Longitude must be less than or equal to 180')
        .test('max-lng-greater-than-min-lng', 'Maximum longitude must be greater than minimum longitude', function (max_lng) {
            if (max_lng !== null && this.parent.min_lng !== null) {
                return max_lng > this.parent.min_lng
            }
            return true
        }),
    from_date: yup
        .date()
        .notRequired()
        .typeError('Please enter a valid date')
        .min(new Date("2014-04-03T00:00:00"), 'The date must be after 03/04/2014, which is the launch date of Sentinel-1')
        .max(new Date(dayjs().utcOffset(0, false).format('YYYY-MM-DD')), 'The date cannot be in the future')
        .test('from-date-before-to-date', '"From" date cannot be after "To" date', function (from_date) {
            if (from_date !== null && this.parent.to_date !== null) {
                return from_date <= this.parent.to_date
            }
            return true
        }),
    to_date: yup
        .date()
        .notRequired()
        .typeError('Please enter a valid date')
        .min(new Date("2014-04-03T00:00:00"), 'The date must be after 03/04/2014, which is the launch date of Sentinel-1')
        .max(new Date(dayjs().utcOffset(0, false).format('YYYY-MM-DD')), 'The date cannot be in the future')
        .test('to-date-after-from-date', '"To" cannot be before "From" date', function (to_date) {
            if (to_date !== null && this.parent.from_date !== null) {
                return to_date >= this.parent.from_date
            }
            return true
        }),
})

// /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;(){}\[\]<>|/'"_+\-=\~^#]{8,}$/


// aA3@$!%*?&.,:;(){}[]<>|/'"_+-=~^#
export const signUpSchema = yup.object().shape({
    email: yup
        .string()
        .required("This field is required")
        .email("Invalid email address"),
    password: yup
        .string()
        .required("This field is required")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;(){}\[\]<>|/'"_+-=~^#]{8,}$/,
            "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number."
        ),
    re_password: yup
        .string()
        .required("This field is required")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;(){}\[\]<>|/'"_+\-=\~^#]{8,}$/,
            "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number."
        )
        .oneOf([yup.ref("password")], "Passwords do not match")
})


export const logInSchema = yup.object().shape({
    email: yup
        .string()
        .required("This field is required")
        .email("Invalid email address"),
    password: yup
        .string()
        .required("This field is required")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;(){}\[\]<>|/'"_+-=~^#]{8,}$/,
            "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number."
        )
})


export const changePasswordSchema = yup.object().shape({
    current_password: yup
        .string()
        .required("This field is required")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;(){}\[\]<>|/'"_+-=~^#]{8,}$/,
            "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number."
        ),
    new_password: yup
        .string()
        .required("This field is required")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;(){}\[\]<>|/'"_+-=~^#]{8,}$/,
            "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number."
        )
        .notOneOf([yup.ref("current_password")], "New password cannot be the same as the current password"),
    re_new_password: yup
        .string()
        .required("This field is required")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;(){}\[\]<>|/'"_+-=~^#]{8,}$/,
            "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number."
        )
        .oneOf([yup.ref("new_password")], "Passwords do not match")
})


export const deleteAccountSchema = yup.object().shape({
    current_password: yup
        .string()
        .required("This field is required")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;(){}\[\]<>|/'"_+-=~^#]{8,}$/,
            "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number."
        ),
})


export const emailSchema = yup.object().shape({
    email: yup
        .string()
        .required("This field is required")
        .email("Invalid email address"),
})


export const resetPasswordSchema = yup.object().shape({
    new_password: yup
        .string()
        .required("This field is required")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;(){}\[\]<>|/'"_+-=~^#]{8,}$/,
            "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number."
        )
        .notOneOf([yup.ref("current_password")], "New password cannot be the same as the current password"),
    re_new_password: yup
        .string()
        .required("This field is required")
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&.,:;(){}\[\]<>|/'"_+-=~^#]{8,}$/,
            "Password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, and one number."
        )
        .oneOf([yup.ref("new_password")], "Passwords do not match")
})