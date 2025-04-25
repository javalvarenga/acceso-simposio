import axios from "axios"

// Creamos una instancia personalizada de Axios
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor de request: agrega el token de autenticación si existe
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // Ocurrió un error al preparar la request
    console.error("[Axios Request Error]", error)
    return Promise.reject(error)
  }
)

// Interceptor de response: captura errores de red o de backend
api.interceptors.response.use(
  (response) => response, // Pasamos las respuestas exitosas tal cual
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de error (4xx, 5xx)
      console.error("[Axios Response Error]", {
        status: error.response.status,
        data: error.response.data,
      })
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error("[Axios No Response]", error.request)
    } else {
      // Ocurrió un error en la configuración de la petición
      console.error("[Axios Config Error]", error.message)
    }

    // Puedes mostrar notificaciones globales aquí o redirigir al login si es 401
    if (error.response?.status === 401) {
      // Por ejemplo: window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)