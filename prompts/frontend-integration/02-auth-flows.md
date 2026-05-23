# 02 — Auth flows: Login + Signup rewrite

**Wave**: 2 (parallel with 03, after Wave 1 completes)
**Working dir**: `/Users/josegaelcruzlopez/Downloads/GTM-Builds/frontend`

## Context

Today the signup form writes to `supabase.from("business_signups")` (which doesn't exist in the new schema) and never creates an auth session. The "Iniciar sesión" button in the navbar is inert. We need to:

1. Build a real Supabase Auth signup that creates an auth user, then calls `POST /businesses` to create the business row.
2. Build a `/login` page.
3. Wire the navbar.
4. Persist `businessId` so onboarding (Wave 2's other prompt) can pick it up.

## Prerequisites

Wave 1 must be complete:

- `apiFetch` exists at `frontend/src/lib/api-client.ts`
- `businessesApi` exists at `frontend/src/lib/api/businesses.ts`
- `BUSINESS_CATEGORY_OPTIONS` exists at `frontend/src/lib/business-categories.ts`
- `useSession()` exists at `frontend/src/hooks/use-session.ts`
- `.env` points at the same Supabase project as backend (`lajrjnjyvbpaaspzgpvh`)

## Tasks

### 1. Rewrite `/signup` (`frontend/src/routes/signup.tsx`)

Replace the entire file. The new flow:

1. Add a **password** field (min 8 chars) to the existing form.
2. On submit:
   - Validate with zod (existing pattern).
   - Call `supabase.auth.signUp({ email, password, options: { data: { business_name, business_type } } })`. Set `emailRedirectTo: window.location.origin + '/onboarding'`.
   - If signup returns a session immediately (auto-confirm in dev), proceed to step 3. If not (email confirmation required), show a toast: "Te enviamos un correo para confirmar tu cuenta" and stop.
   - Once a session exists, call `businessesApi.create({ name, category: mapCategory(business_type) })`. Map the Spanish label → enum using `BUSINESS_CATEGORY_OPTIONS`.
3. Save `businessId` to `localStorage['nexoleal:current-business-id']` AND pass it as a search param: `navigate({ to: '/onboarding', search: { businessId, business: business_name } })`.
4. Sonner toast on success; sonner error toast on `ApiError`.

Keep the existing styling, hero copy, and layout — only the form logic + the new password field changes. Use shadcn `<Input type="password" />` with a visible-toggle eye button (use `lucide-react`'s `Eye` / `EyeOff`).

### 2. Create `/login` (`frontend/src/routes/login.tsx`)

New file. Standard shadcn login form:

```tsx
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"
import { Sparkles, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { businessesApi } from "@/lib/api/businesses"
import { ApiError } from "@/lib/api-client"

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

    // After login, figure out where to send the user.
    // If they had a redirect param, use it. Otherwise: if they own a business → dashboard, else → wallet.
    let dest = redirect
    if (!dest) {
      const storedBiz = localStorage.getItem('nexoleal:current-business-id')
      dest = storedBiz ? `/dashboard/${storedBiz}` : '/wallet'
    }
    toast.success("¡Bienvenido!")
    navigate({ to: dest })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Reuse the same header pattern from signup.tsx */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-black">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">NexoLeal</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-[var(--primary)]">
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
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
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
```

### 3. Wire the navbar (`frontend/src/components/landing/Navbar.tsx`)

Find the "Iniciar sesión" button (currently an inert `<Button variant="ghost">`). Wrap it in a `<Link to="/login">` from `@tanstack/react-router`. Keep the existing styling.

Also: if `useSession()` returns a session, show **the user's email and a "Cerrar sesión" button** instead of the "Iniciar sesión" / "Crear cuenta" pair. "Cerrar sesión" calls `supabase.auth.signOut()` then navigates to `/`.

### 4. Sign-out helper (optional but nice)

Create `frontend/src/lib/auth.ts`:

```ts
import { supabase } from '@/integrations/supabase/client'

export async function signOut() {
  await supabase.auth.signOut()
  localStorage.removeItem('nexoleal:current-business-id')
  localStorage.removeItem('nexoleal:staff-key')
}
```

### 5. Search-param validation on signup

Add a search schema so `/signup` accepts no params today but never crashes if extra params arrive:

```ts
export const Route = createFileRoute("/signup")({
  validateSearch: (search) => z.object({}).passthrough().parse(search),
  // ...
})
```

(Already wraps `useState` form — no other change to that schema.)

## Files this prompt creates or modifies

- **Modified**: `frontend/src/routes/signup.tsx`, `frontend/src/components/landing/Navbar.tsx`
- **Created**: `frontend/src/routes/login.tsx`, `frontend/src/lib/auth.ts`

## Done when

- A new email/password signup creates a Supabase auth user **and** a row in the backend's `businesses` table (verify by checking Supabase Studio for that project).
- After successful signup, the browser ends up on `/onboarding?businessId=<uuid>&business=<name>`.
- `/login` accepts the same email/password and redirects to either `/dashboard/<id>` (if a business ID is in localStorage) or `/wallet`.
- The navbar's "Iniciar sesión" link navigates to `/login`.
- After login, the navbar shows the user's email + a "Cerrar sesión" button.
- `npx tsc --noEmit` passes.

## Things to avoid

- DO NOT keep the old `supabase.from("business_signups").insert(...)` — delete that code path.
- DO NOT change `apiFetch` or `businessesApi.create` — they're already correct from Wave 1.
- DO NOT add any new dependencies — everything you need is already installed.
- DO NOT touch the landing page sections (Hero, Benefits, etc.) beyond the navbar fix.
