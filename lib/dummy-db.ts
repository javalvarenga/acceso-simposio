import { cache } from "react"

// Tipos para nuestra base de datos
export type QRCode = {
  id: string
  code: string
  participant_name: string
  email: string
  used: boolean
}

export type Attendance = {
  id: string
  qr_code_id: string
  timestamp: string
}

// Estado inicial de la base de datos
let qrCodes: QRCode[] = [
  {
    id: "1",
    code: "PART001",
    participant_name: "Juan Pérez",
    email: "juan.perez@ejemplo.com",
    used: false,
  },
  {
    id: "2",
    code: "PART002",
    participant_name: "María García",
    email: "maria.garcia@ejemplo.com",
    used: false,
  },
  {
    id: "3",
    code: "PART003",
    participant_name: "Carlos Rodríguez",
    email: "carlos.rodriguez@ejemplo.com",
    used: true,
  },
  {
    id: "4",
    code: "PART004",
    participant_name: "Ana Martínez",
    email: "ana.martinez@ejemplo.com",
    used: false,
  },
  {
    id: "5",
    code: "PART005",
    participant_name: "Luis Sánchez",
    email: "luis.sanchez@ejemplo.com",
    used: false,
  },
]

const attendance: Attendance[] = [
  {
    id: "1",
    qr_code_id: "3",
    timestamp: new Date().toISOString(),
  },
]

// Funciones para interactuar con la base de datos
export const db = {
  // QR Codes
  getQRCodeByCode: cache(async (code: string) => {
    return qrCodes.find((qr) => qr.code === code) || null
  }),

  updateQRCode: async (id: string, data: Partial<QRCode>) => {
    const index = qrCodes.findIndex((qr) => qr.id === id)
    if (index === -1) return null

    qrCodes[index] = { ...qrCodes[index], ...data }
    return qrCodes[index]
  },

  addQRCode: async (participant_name: string, email: string) => {
    const id = (qrCodes.length + 1).toString()
    const code = `PART${Math.floor(1000 + Math.random() * 9000)}`

    const newQRCode: QRCode = {
      id,
      code,
      participant_name,
      email,
      used: false,
    }

    qrCodes.push(newQRCode)
    return newQRCode
  },

  deleteQRCode: async (id: string) => {
    const index = qrCodes.findIndex((qr) => qr.id === id)
    if (index === -1) return false

    qrCodes = qrCodes.filter((qr) => qr.id !== id)
    return true
  },

  // Attendance
  addAttendance: async (qr_code_id: string) => {
    const id = (attendance.length + 1).toString()

    const newAttendance: Attendance = {
      id,
      qr_code_id,
      timestamp: new Date().toISOString(),
    }

    attendance.push(newAttendance)
    return newAttendance
  },
}
