const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api'

export const API_ROUTES = {
	login: '/users/login',
	signup: '/users/signup',
	forgotPassword: '/users/forgot-password',
}

export default API_BASE_URL
