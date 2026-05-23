import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Sparkles, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { businessesApi } from "@/lib/api/businesses";
import { ApiError } from "@/lib/api-client";
import {
  BUSINESS_CATEGORY_OPTIONS,
  type BusinessCategory,
} from "@/lib/business-categories";

export const Route = createFileRoute("/signup")({
  validateSearch: (search) => z.object({}).passthrough().parse(search),
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Crear cuenta de mi negocio · NexoLeal" },
      {
        name: "description",
        content:
          "Crea tu cuenta de NexoLeal en menos de 2 minutos y empieza a fidelizar a tus clientes sin tarjetas de cartón.",
      },
    ],
  }),
});

const signupSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(2, { message: "Ingresa el nombre de tu negocio" })
    .max(120, { message: "Máximo 120 caracteres" }),
  email: z
    .string()
    .trim()
    .email({ message: "Correo inválido" })
    .max(255, { message: "Máximo 255 caracteres" }),
  password: z
    .string()
    .min(8, { message: "Mínimo 8 caracteres" })
    .max(72, { message: "Máximo 72 caracteres" }),
  business_type: z
    .string()
    .min(1, { message: "Selecciona un tipo de negocio" })
    .max(60),
});

const CURRENT_BUSINESS_KEY = "nexoleal:current-business-id";

function mapCategory(label: string): BusinessCategory {
  const found = BUSINESS_CATEGORY_OPTIONS.find((o) => o.label === label);
  return found?.value ?? "other";
}

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    business_name: "",
    email: "",
    password: "",
    business_type: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: {
              business_name: parsed.data.business_name,
              business_type: parsed.data.business_type,
            },
          },
        });

      if (signUpError) {
        toast.error(signUpError.message);
        setSubmitting(false);
        return;
      }

      if (!signUpData.session) {
        toast.success(
          "Te enviamos un correo para confirmar tu cuenta",
        );
        setSubmitting(false);
        return;
      }

      const category = mapCategory(parsed.data.business_type);
      const { business } = await businessesApi.create({
        name: parsed.data.business_name,
        category,
      });

      try {
        localStorage.setItem(CURRENT_BUSINESS_KEY, business.id);
      } catch {
        // localStorage may be unavailable (private mode); search params are the source of truth.
      }

      toast.success("¡Cuenta creada! Vamos a configurar tu negocio.");
      await navigate({
        to: "/onboarding",
        // Onboarding's search schema is widened in the parallel Wave 2 prompt
        // (03-onboarding-persistence) to accept `businessId`. Cast for now.
        search: {
          businessId: business.id,
          business: parsed.data.business_name,
        } as unknown as { business?: string; type?: string },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        console.error("Signup failed:", error);
        toast.error("No pudimos crear tu cuenta. Intenta de nuevo.");
      }
      setSubmitting(false);
    }
  };

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
          <span className="section-title mb-4">Crear cuenta</span>
          <h1 className="page-title mb-4">
            Empieza a fidelizar a tus clientes hoy.
          </h1>
          <p className="muted-text text-lg">
            Configura tu programa de lealtad digital en minutos. Sin tarjetas,
            sin hardware, sin tarjeta de crédito.
          </p>
          <ul className="muted-text mt-8 space-y-3 text-sm">
            <li>✓ 30 días de prueba gratuita</li>
            <li>✓ Soporte en español</li>
            <li>✓ Cancela cuando quieras</li>
          </ul>
        </section>

        <section className="card mx-auto w-full max-w-md p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">
            Crea tu cuenta de negocio
          </h2>
          <p className="muted-text mt-1 text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-[var(--primary)] underline">
              Inicia sesión
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="business_name">Nombre del negocio</Label>
              <Input
                id="business_name"
                value={form.business_name}
                onChange={(e) =>
                  setForm({ ...form, business_name: e.target.value })
                }
                placeholder="Ej. Estudio Navaja"
                maxLength={120}
                aria-invalid={!!errors.business_name}
              />
              {errors.business_name && (
                <p className="text-xs text-destructive">{errors.business_name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="tu@negocio.com"
                maxLength={255}
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
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  maxLength={72}
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

            <div className="space-y-1.5">
              <Label htmlFor="business_type">Tipo de negocio</Label>
              <Select
                value={form.business_type}
                onValueChange={(v) => setForm({ ...form, business_type: v })}
              >
                <SelectTrigger
                  id="business_type"
                  aria-invalid={!!errors.business_type}
                >
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.label} value={option.label}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.business_type && (
                <p className="text-xs text-destructive">{errors.business_type}</p>
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Creando...
                </>
              ) : (
                "Crear cuenta de mi negocio"
              )}
            </Button>

            <p className="text-center text-xs text-muted">
              Al crear tu cuenta aceptas nuestros Términos y Política de
              Privacidad.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
