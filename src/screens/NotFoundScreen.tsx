import { useNavigate } from "react-router"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function NotFoundScreen() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg items-center px-4">
      <Card className="w-full items-center gap-4 p-8 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-muted">
          <Compass className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Sahifa topilmadi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Siz izlagan sahifa mavjud emas yoki ko'chirilgan.
          </p>
        </div>
        <Button size="lg" onClick={() => navigate("/")}>
          Bosh sahifaga
        </Button>
      </Card>
    </div>
  )
}
