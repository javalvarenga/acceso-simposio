import { Suspense } from "react"
import QRScanner from "@/components/qr-scanner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Control de Acceso</CardTitle>
            <CardDescription>Simposio de Tecnología</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-64 flex items-center justify-center">Cargando...</div>}>
              <QRScanner />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
