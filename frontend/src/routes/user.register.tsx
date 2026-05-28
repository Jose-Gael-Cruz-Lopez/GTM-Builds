import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ConsumerFlowShell } from "@/components/consumer/ConsumerFlowShell";
import { useLocale } from "@/contexts/LocaleContext";
import { consumerApi, CONSUMER_SESSION_KEY } from "@/lib/api/consumer";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/user/register")({
  component: UserRegisterPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Únete · NexoLeal" }] }),
});

const _baseSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/),
  referralCode: z.string().trim().optional(),
});
type FormValues = z.infer<typeof _baseSchema>;

function UserRegisterPage() {
  const navigate = useNavigate();
  const { d } = useLocale();

  const form = useForm<FormValues>({
    resolver: zodResolver(
      z.object({
        phone: z
          .string()
          .trim()
          .regex(/^\d{10}$/, d.userRegister.phoneInvalid),
        referralCode: z.string().trim().optional(),
      }),
    ),
    defaultValues: { phone: "", referralCode: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      let result: Awaited<ReturnType<typeof consumerApi.register>>;
      try {
        result = await consumerApi.register({
          username: values.phone,
          referralCode: values.referralCode || undefined,
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          const login = await consumerApi.login({ username: values.phone });
          if (!login.accessToken) throw new Error("Login failed");
          result = {
            accessToken: login.accessToken,
            refreshToken: login.refreshToken,
            expiresIn: login.expiresIn,
            client: login.client
              ? { ...login.client, referredBy: false }
              : { id: "", username: values.phone, referralCode: "", referredBy: false },
          };
        } else {
          throw e;
        }
      }

      localStorage.setItem(
        CONSUMER_SESSION_KEY,
        JSON.stringify({
          phone: values.phone,
          referralCode: result.client.referralCode || values.referralCode || null,
          registeredAt: Date.now(),
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }),
      );
      toast.success(d.userRegister.successMsg);
      navigate({ to: "/user/dashboard" });
    } catch {
      toast.error(d.userRegister.errorMsg);
    }
  };

  return (
    <ConsumerFlowShell
      stepKey="register"
      stepNumber={1}
      totalSteps={2}
      stepLabel={d.userRegister.accessStep}
      headline={d.userRegister.title}
      subtitle={d.userRegister.subtitle}
      showBack
      onBack={() => navigate({ to: "/" })}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="auth-flow-field">
          <label htmlFor="phone" className="auth-flow-label">
            {d.userRegister.phoneLabel}
          </label>
          <Input
            id="phone"
            type="tel"
            placeholder={d.userRegister.phonePlaceholder}
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            className="auth-flow-input"
            aria-invalid={!!form.formState.errors.phone}
            {...form.register("phone")}
          />
          {form.formState.errors.phone ? (
            <p className="text-xs text-[color:var(--color-status-risk)]">
              {form.formState.errors.phone.message}
            </p>
          ) : null}
        </div>

        <div className="auth-flow-field">
          <label htmlFor="referral" className="auth-flow-label">
            {d.userRegister.referralLabel}{" "}
            <span className="font-normal text-[var(--ink-mute)]">
              {d.userRegister.referralOptional}
            </span>
          </label>
          <Input
            id="referral"
            placeholder={d.userRegister.referralPlaceholder}
            className="auth-flow-input"
            {...form.register("referralCode")}
          />
        </div>

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="auth-flow-btn auth-flow-btn-full auth-flow-btn-primary inline-flex items-center justify-center gap-2"
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            d.userRegister.submit
          )}
        </button>
      </form>

      <p className="auth-flow-footnote">
        {d.userRegister.ownerCta} <Link to="/signup">{d.userRegister.ownerLink}</Link>
      </p>
    </ConsumerFlowShell>
  );
}
