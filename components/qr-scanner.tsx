"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Camera, Keyboard } from "lucide-react"
import { verifyQRCode } from "@/lib/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

type ScanResult = {
  success: boolean
  message: string
  participantName?: string
  participantEmail?: string
}

export default function QRScanner() {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Función para verificar un código QR
  const verifyCode = async (code: string) => {
    if (!code || loading) return

    setLoading(true)
    try {
      const verificationResult = await verifyQRCode(code)
      setResult(verificationResult)
      setManualCode("")
    } catch (error) {
      setResult({
        success: false,
        message: "Error al verificar el código QR. Intente nuevamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejar la entrada manual
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verifyCode(manualCode)
  }

  // Iniciar la cámara
  const startCamera = async () => {
    try {
      setCameraError(null)
      setScanning(true)

      if (!videoRef.current) return

      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      // Guardar referencia al stream para poder detenerlo después
      streamRef.current = stream

      // Asignar el stream al elemento de video
      videoRef.current.srcObject = stream
      videoRef.current.play()

      // Iniciar el escaneo
      scanQRCode()
    } catch (error) {
      console.error("Error al acceder a la cámara:", error)
      setCameraError("No se pudo acceder a la cámara. Verifique los permisos del navegador.")
      setScanning(false)
    }
  }

  // Detener la cámara
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setScanning(false)
  }

  // Escanear el código QR
  const scanQRCode = () => {
    if (!scanning) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      // Si el video no está listo, intentar de nuevo en el próximo frame
      requestAnimationFrame(scanQRCode)
      return
    }

    const context = canvas.getContext("2d")
    if (!context) return

    // Establecer dimensiones del canvas según el video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Obtener los datos de la imagen
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    // Intentar decodificar el código QR
    try {
      // Aquí usamos la función global jsQR que será cargada desde un CDN
      // @ts-ignore - jsQR será cargado desde un CDN
      const code = window.jsQR?.(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (code) {
        // Si se encontró un código QR, detener la cámara y verificar el código
        stopCamera()
        verifyCode(code.data)
        return
      }
    } catch (error) {
      console.error("Error al decodificar QR:", error)
    }

    // Si no se encontró un código QR, seguir escaneando
    requestAnimationFrame(scanQRCode)
  }

  // Limpiar al desmontar el componente
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Script para cargar la biblioteca jsQR */}
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js" async></script>

      {result ? (
        // Mostrar resultado del escaneo
        <div className="w-full space-y-4">
          <Alert className={result.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <AlertTitle className={result.success ? "text-green-800" : "text-red-800"}>
                {result.success ? "Acceso Registrado" : "Acceso Denegado"}
              </AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              {result.message}
              {result.participantName && (
                <div className="mt-3 p-3 bg-white rounded-md border">
                  <h3 className="font-medium">Información del Participante:</h3>
                  <p className="mt-1">Nombre: {result.participantName}</p>
                  <p>Email: {result.participantEmail}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>

          <Button className="w-full" onClick={() => setResult(null)}>
            Escanear otro código
          </Button>
        </div>
      ) : (
        // Interfaz de escaneo
        <Tabs defaultValue="camera" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera">
              <Camera className="h-4 w-4 mr-2" />
              Cámara
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Keyboard className="h-4 w-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-4">
            <div className="relative">
              {scanning ? (
                <>
                  <video ref={videoRef} className="w-full h-64 object-cover rounded-md bg-black" playsInline />
                  <canvas
                    ref={canvasRef}
                    className="hidden" // Oculto, solo se usa para procesar la imagen
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white rounded-lg opacity-70"></div>
                  </div>
                  <Button variant="secondary" className="absolute bottom-2 right-2" onClick={stopCamera}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Card className="p-4 flex flex-col items-center justify-center h-64 border-dashed">
                  {cameraError ? (
                    <div className="text-center p-4">
                      <p className="text-sm text-red-600 mb-4">{cameraError}</p>
                      <Button onClick={startCamera}>Intentar de nuevo</Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 mb-4">Haz clic para activar la cámara</p>
                      <Button onClick={startCamera}>Activar Cámara</Button>
                    </div>
                  )}
                </Card>
              )}
            </div>

            <div className="text-sm text-gray-500">
              <p>Nota: El acceso a la cámara requiere:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Permisos del navegador</li>
                <li>Conexión HTTPS (excepto en localhost)</li>
                <li>Dispositivo con cámara</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manualCode">Código QR</Label>
                <Input
                  id="manualCode"
                  placeholder="Ingrese el código (ej: PART001)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={!manualCode || loading}>
                {loading ? "Verificando..." : "Verificar Código"}
              </Button>
            </form>

            <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
              <p className="font-medium mb-1">Códigos de prueba disponibles:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>PART001 - Juan Pérez (Válido)</li>
                <li>PART002 - María García (Válido)</li>
                <li>PART003 - Carlos Rodríguez (Ya usado)</li>
                <li>PART004 - Ana Martínez (Válido)</li>
                <li>PART005 - Luis Sánchez (Válido)</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
