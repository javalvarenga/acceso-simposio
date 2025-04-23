"use server"

import { db } from "@/lib/dummy-db"
import { revalidatePath } from "next/cache"

export async function verifyQRCode(code: string) {
  try {
    // Verificar si el código existe y no ha sido usado
    const qrCode = await db.getQRCodeByCode(code)

    if (!qrCode) {
      return {
        success: false,
        message: "Código QR inválido. Este código no está registrado.",
      }
    }

    if (qrCode.used) {
      return {
        success: false,
        message: "Código QR ya utilizado. Acceso denegado.",
        participantName: qrCode.participant_name,
        participantEmail: qrCode.email,
      }
    }

    // Marcar el código como usado
    await db.updateQRCode(qrCode.id, { used: true })

    // Registrar la asistencia
    await db.addAttendance(qrCode.id)

    revalidatePath("/")

    return {
      success: true,
      message: "¡Acceso registrado correctamente!",
      participantName: qrCode.participant_name,
      participantEmail: qrCode.email,
    }
  } catch (error) {
    console.error("Error al verificar el código QR:", error)
    return {
      success: false,
      message: "Error al procesar la solicitud. Intente nuevamente.",
    }
  }
}

export async function addParticipant(formData: FormData) {
  try {
    const participantName = formData.get("participantName") as string

    if (!participantName) {
      return {
        success: false,
        message: "El nombre del participante es requerido.",
      }
    }

    const email = `${participantName.toLowerCase().replace(/\s+/g, ".")}@example.com`
    const newQRCode = await db.addQRCode(participantName, email)

    revalidatePath("/admin")

    return {
      success: true,
      message: "Participante agregado correctamente.",
      qrCode: newQRCode,
    }
  } catch (error) {
    console.error("Error al agregar participante:", error)
    return {
      success: false,
      message: "Error al agregar participante. Intente nuevamente.",
    }
  }
}

export async function deleteParticipant(id: string) {
  try {
    const success = await db.deleteQRCode(id)

    if (!success) {
      return {
        success: false,
        message: "No se pudo eliminar el participante.",
      }
    }

    revalidatePath("/admin")

    return {
      success: true,
      message: "Participante eliminado correctamente.",
    }
  } catch (error) {
    console.error("Error al eliminar participante:", error)
    return {
      success: false,
      message: "Error al eliminar participante. Intente nuevamente.",
    }
  }
}
