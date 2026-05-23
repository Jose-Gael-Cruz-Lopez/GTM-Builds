import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"
import { Sparkles, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute("/login")({
  validateSearch: (s) => searchSchema.parse(s),
  component: LoginPage,
  head: () => ({
    meta: [{ title: "Iniciar sesión · NexoLeal" }],
  }),
})

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()
  const [form, setForm] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const parsed = loginSchema.safeParse(form)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const i of parsed.error.issues) {
        const k = i.path[0]?.toString()
        if (k && !next[k]) next[k] = i.message
      }
      setErrors(next)
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword(parsed.data)
    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    let dest = redirect
    if (!dest) {
      const storedBiz = localStorage.getItem("nexoleal:current-business-id")
      dest = storedBiz ? `/dashboard/${storedBiz}` : "/wallet"
    }
    toast.success("¡Bienvenido!")
    // `dest` is a runtime-computed path that may target routes registered in
    // later waves (e.g. /dashboard/:id, /wallet); cast to satisfy router typing.
    await navigate({ to: dest as never })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-black">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">NexoLeal</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-[var(--primary)]"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <section className="hidden flex-col justify-center lg:flex">
          <span className="section-title mb-4">Iniciar sesión</span>
          <h1 className="page-title mb-4">Bienvenido de vuelta.</h1>
          <p className="muted-text text-lg">
            Accede a tu panel para ver tus clientes, generar campañas y revisar
            métricas de retención.
          </p>
        </section>

        <section className="card mx-auto w-full max-w-md p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">Inicia sesión</h2>
          <p className="muted-text mt-1 text-sm">
            ¿Aún no tienes cuenta?{" "}
            <Link to="/signup" className="text-[var(--primary)] underline">
              Crea una aquí
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="tu@negocio.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
        </section>
      </main>
    </div>
  )
}
