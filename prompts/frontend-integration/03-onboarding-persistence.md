# 03 — Onboarding persistence: wire steps to backend

**Wave**: 2 (parallel with 02, after Wave 1)
**Working dir**: `/Users/josegaelcruzlopez/Downloads/GTM-Builds/frontend`

## Context

Today `/onboarding` is a static 3-step wizard with no API calls. It accepts `business` (name) and `type` (label) as search params. After Wave 2's auth prompt rewrites signup, it will instead arrive with a `businessId` UUID in search params + localStorage. We need to wire the wizard to:

1. Validate the user actually owns the `businessId` (otherwise redirect to `/login`).
2. Step 2 ("Crea tu primera recompensa"): collect `stampsRequired` (1–30 slider) and `rewardDescription` (text), then `PATCH /businesses/:id/loyalty-config`.
3. Step 3 ("Imprime y comparte tu QR"): create a staff key via `POST /businesses/:id/staff-keys` (label: "Default device") and show the resulting `headerValue` + a "Copy" button. Also show a button "Ir al panel" → `/dashboard/<businessId>`.

## Prerequisites

- Wave 1 complete (apiFetch, businessesApi, useSession exist).
- Wave 2's `02-auth-flows.md` may run in parallel — this prompt does not import anything from it. They both edit different files.

## Tasks

### 1. Rewrite `/onboarding` (`frontend/src/routes/onboarding.tsx`)

Update the route's search schema:

```ts
const searchSchema = z.object({
  businessId: z.string().uuid().optional(),
  business: z.string().trim().max(120).optional(),
  type: z.string().trim().max(60).optional(),
})
```

If `businessId` is missing, redirect to `/signup` in `beforeLoad`:

```ts
export const Route = createFileRoute("/onboarding")({
  validateSearch: (s) => searchSchema.parse(s),
  beforeLoad: ({ search }) => {
    if (!search.businessId) {
      throw redirect({ to: '/signup' })
    }
  },
  component: OnboardingPage,
  // ...
})
```

### 2. Step state machine

Keep the existing 3-step structure (icons, copy, progress). Convert the static `STEPS` array into a step-driven UI with real forms.

```ts
type Step = 'brand' | 'reward' | 'finish'

function OnboardingPage() {
  const { businessId, business, type } = Route.useSearch()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('brand')

  // ...
}
```

### 3. Step 1 — Brand (placeholder, no API)

Show a friendly card explaining brand customization is coming soon. Keep the existing copy. The "Continuar" button advances to `step = 'reward'`. No API call.

### 4. Step 2 — Reward (real form, real PATCH)

A small form with two fields:

```tsx
const [stampsRequired, setStampsRequired] = useState(10)
const [rewardDescription, setRewardDescription] = useState("Servicio gratis")
```

Use a shadcn `<Slider>` for stamps (range 1–30) and `<Input>` for reward description (max 120 chars). A `<Button>` "Guardar y continuar" calls a React Query mutation:

```ts
const updateConfig = useMutation({
  mutationFn: () =>
    businessesApi.updateLoyaltyConfig(businessId!, {
      stampsRequired,
      rewardDescription,
    }),
  onSuccess: () => {
    toast.success("Recompensa configurada")
    setStep('finish')
  },
  onError: (e: ApiError) => toast.error(e.message),
})
```

(Add `import { useMutation, useQueryClient } from '@tanstack/react-query'` and the existing query client is already in `__root.tsx`.)

### 5. Step 3 — Finish: staff key creation + dashboard CTA

When the user enters step 3, automatically fire `POST /businesses/:id/staff-keys` with `{ label: 'Default device' }`. Store the returned `headerValue` in localStorage as `nexoleal:staff-key` (so the scanner page can read it later) and display it on screen with a copy-to-clipboard button.

```ts
const staffKeyQuery = useQuery({
  queryKey: ['business', businessId, 'first-staff-key'],
  queryFn: () => businessesApi.createStaffKey(businessId!, { label: 'Default device' }),
  enabled: step === 'finish',
  staleTime: Infinity,
  retry: false,
})

useEffect(() => {
  if (staffKeyQuery.data?.headerValue) {
    localStorage.setItem('nexoleal:staff-key', staffKeyQuery.data.headerValue)
  }
}, [staffKeyQuery.data])
```

Render UI:

```tsx
<div className="card p-6">
  <h2 className="font-display text-xl font-semibold">¡Tu negocio está listo!</h2>
  <p className="muted-text mt-1 text-sm">
    Guarda esta llave del staff. Es lo que tu personal usará para escanear códigos QR
    desde la caja.
  </p>

  <div className="mt-4 rounded-lg border border-dashed bg-[var(--surface-2)] p-3">
    <code className="text-xs break-all">{staffKeyQuery.data?.headerValue}</code>
  </div>

  <Button
    variant="outline"
    size="sm"
    className="mt-2"
    onClick={() => {
      navigator.clipboard.writeText(staffKeyQuery.data?.headerValue ?? '')
      toast.success("Copiado al portapapeles")
    }}
  >
    Copiar llave
  </Button>

  <div className="mt-6 flex gap-3">
    <Button asChild size="lg">
      <Link to="/dashboard/$businessId" params={{ businessId: businessId! }}>
        Ir al panel
      </Link>
    </Button>
    <Button asChild variant="outline" size="lg">
      <Link to="/scan">Probar el escáner</Link>
    </Button>
  </div>
</div>
```

### 6. Progress indicator

Keep the existing 3-card progress UI from the original. Update its active-step calculation based on the new `step` variable (`'brand' = 0`, `'reward' = 1`, `'finish' = 2`).

## Files this prompt creates or modifies

- **Modified**: `frontend/src/routes/onboarding.tsx`

That's it. Single-file change.

## Done when

- Visiting `/onboarding` without a `businessId` redirects to `/signup`.
- Visiting `/onboarding?businessId=<real-uuid>` shows step 1.
- Saving in step 2 calls `PATCH /businesses/:id/loyalty-config` and the change is visible in the database (re-check via `GET` or Supabase Studio).
- Reaching step 3 creates a staff key, stores it in localStorage, and shows it on screen.
- The "Ir al panel" button routes to `/dashboard/$businessId`.
- `npx tsc --noEmit` passes.

## Things to avoid

- DO NOT delete the existing Spanish copy / animations / illustration styling — only the form logic + state machine changes.
- DO NOT call `apiFetch` directly — always go through `businessesApi.*`.
- DO NOT block step 1 on an API call — it's a soft "later" placeholder.
- DO NOT show the staff key's `rawKey` separately from `headerValue` — `headerValue` is what the scanner needs (`businessId:rawKey`).
