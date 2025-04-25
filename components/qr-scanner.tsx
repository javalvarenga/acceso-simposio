"use client"

import { useState, useRef, useEffect } from "react"
import { api } from "@/services/api" 
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function Html5QRCodeScanner() {
  const [qrValue, setQrValue] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<string>("Esperando inicialización")
  const [scannerReady, setScannerReady] = useState(false)
  const [respuestaServidor, setRespuestaServidor] = useState<number | null>(null)


  const scannerRef = useRef<HTMLDivElement>(null)
  const scannerInstance = useRef<any>(null)

  // Función para agregar logs
  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Inicializar cuando el componente se monta
  useEffect(() => {
    addLog("Componente inicializado")
    
    // Cargar la biblioteca Html5-QRCode
    const script = document.createElement('script')
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"
    script.onload = () => {
      addLog("Biblioteca Html5-QRCode cargada correctamente")
      setScannerReady(true)
    }
    script.onerror = () => {
      addLog("Error al cargar la biblioteca Html5-QRCode")
      setStatus("ERROR: No se pudo cargar la biblioteca")
    }
    document.body.appendChild(script)

    // Limpiar al desmontar
    return () => {
      stopScanner()
    }
  }, [])

  // Iniciar el escáner
  const startScanner = async () => {
    try {
      setStatus("Inicializando escáner...")
      addLog("Iniciando escáner QR")

      if (!scannerRef.current) {
        addLog("ERROR: Referencia al div del escáner no disponible")
        return
      }

      // Verificar que la biblioteca esté cargada
      if (typeof window.Html5Qrcode === 'undefined') {
        addLog("ERROR: Html5Qrcode no está disponible")
        setStatus("ERROR: Biblioteca no disponible")
        return
      }

      // Crear instancia del escáner
      const html5QrCode = new window.Html5Qrcode("qr-reader")
      scannerInstance.current = html5QrCode
      addLog("Instancia de escáner creada")

      // Configurar opciones
      const config = {
        fps: 10,
        qrbox: 250,
        aspectRatio: 1.0,
        disableFlip: false,
      }

      // Iniciar la cámara
      addLog("Solicitando acceso a la cámara")
      setStatus("Accediendo a la cámara...")
      
      await html5QrCode.start(
        { facingMode: "environment" }, // Usar cámara trasera si está disponible
        config,
        async (qrCodeMessage) => {
          const limpio = qrCodeMessage.replace(/^https?:\/\/(www\.)?/, "")
          addLog(`QR detectado: ${limpio}`)
          setStatus("QR detectado correctamente")
          stopScanner()
          setQrValue(limpio)
        
          try {
            const res = await api.post("/participants/scannerQR", {
              codigoQR: limpio,
            })
            const respuesta = res.data?.result?.[0]?.resultado
            setRespuestaServidor(respuesta)
            if (respuesta === 1) {
              setStatus("✅ Asistencia registrada")
              addLog("Servidor confirmó asistencia.")
            } else {
              setStatus("❌ Código QR no permitido")
              addLog("Servidor rechazó el código.")
            }
        
            addLog(`Respuesta del servidor: ${JSON.stringify(res.data)}`)
          } catch (err: any) {
            addLog(`Error al verificar QR: ${err.response?.data?.message || err.message}`)
          }
        },
        (errorMessage) => {
          // Este callback se llama cuando hay un error en el escaneo (no cuando falla la inicialización)
          // No hacemos nada porque es normal que se llame cuando no hay QR en la vista
        }
      )
      
      addLog("Escáner iniciado correctamente")
      setStatus("Escaneando... Acerca el código QR a la cámara")
      
    } catch (error: any) {
      addLog(`Error al iniciar el escáner: ${error.message || error}`)
      setStatus(`ERROR: ${error.message || "Error desconocido"}`)
    }
  }

  // Detener el escáner
  const stopScanner = () => {
    if (scannerInstance.current) {
      addLog("Deteniendo escáner")
      
      try {
        scannerInstance.current.stop()
          .then(() => {
            addLog("Escáner detenido correctamente")
          })
          .catch((err: any) => {
            addLog(`Error al detener el escáner: ${err}`)
          })
      } catch (error) {
        addLog("Error al intentar detener el escáner")
      }
      
      scannerInstance.current = null
    }
  }

  // Reiniciar
  const resetScanner = () => {
    setQrValue(null)
    setLogs([])
    setStatus("Esperando inicialización")
    stopScanner()
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Escáner QR</h2>
      
      {qrValue && respuestaServidor !== null && (
        <div
          className={`mb-4 p-4 border rounded-md flex items-center gap-4 shadow-md transition-all
            ${respuestaServidor === 1
              ? "bg-green-50 border-green-300 text-green-800"
              : "bg-red-50 border-red-300 text-red-800"
            }`}
        >
          {respuestaServidor === 1 ? (
            <CheckCircle className="w-10 h-10 text-green-600" />
          ) : (
            <XCircle className="w-10 h-10 text-red-600" />
          )}

          <div>
            <h3 className="text-lg font-semibold">
              {respuestaServidor === 1 ? "✅ Asistencia registrada" : "❌ Código QR no permitido"}
            </h3>
            <p className="text-sm mt-1 break-all">{qrValue}</p>
          </div>
        </div>
      )}


      {qrValue ? (
        <div className="mb-6 flex flex-col items-center text-center space-y-4">
        <div className="w-full max-w-md p-4 bg-green-50 border border-green-300 rounded-md shadow-md">
          <h3 className="font-bold text-green-700 text-lg">QR Detectado</h3>
        </div>
    
        <button
          onClick={resetScanner}
          className="px-5 py-2 mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
        >
          Escanear otro código
        </button>
        </div>
      ): (
        <>
          {/* Contenedor para el escáner */}
          <div 
            id="qr-reader" 
            ref={scannerRef} 
            className="mb-4 w-full border rounded-md overflow-hidden"
            style={{ minHeight: "300px" }}
          />
          
          <div className="flex gap-2 mb-4">
            <button 
              onClick={startScanner}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
              disabled={!scannerReady || status.includes("Escaneando")}
            >
              Iniciar Escáner
            </button>
            <button 
              onClick={resetScanner} // ahora reinicia todo
              className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
            >
              Detener Escáner
            </button>
          </div>
        </>
      )}
      
      {/* Logs de depuración */}
      <div className="mt-4">
        <h3 className="font-bold mb-2">Log de Depuración:</h3>
        <div className="max-h-40 overflow-y-auto p-2 bg-gray-100 rounded text-xs font-mono">
          {logs.length === 0 ? (
            <p className="text-gray-500">No hay información de depuración</p>
          ) : (
            logs.map((line, i) => <div key={i} className="mb-1">{line}</div>)
          )}
        </div>
      </div>
    </div>
  )
}

// Declaración para TypeScript
declare global {
  interface Window {
    Html5Qrcode: any;
  }
}
