import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLocale } from "@/contexts/LocaleContext";

export const Route = createFileRoute("/user/register")({
  component: UserRegisterPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Únete · NexoLeal" }] }),
});

// Static shape for type inference; messages are injected at runtime via the hook below.
const _baseSchema = z.object({
  phone: z.string().trim().regex(/^\d{10}$/),
  referralCode: z.string().trim().optional(),
});
type FormValues = z.infer<typeof _baseSchema>;

function UserRegisterPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { d } = useLocale();

  // Rebuild schema when locale changes so validation messages are always in the active language.
  const form = useForm<FormValues>({
    resolver: zodResolver(
      z.object({
        phone: z.string().trim().regex(/^\d{10}$/, d.userRegister.phoneInvalid),
        referralCode: z.string().trim().optional(),
      }),
    ),
    defaultValues: { phone: "", referralCode: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      localStorage.setItem(
        "nexoleal:consumer-session",
        JSON.stringify({
          phone: values.phone,
          referralCode: values.referralCode ?? null,
          registeredAt: Date.now(),
        }),
      );
      toast.success(d.userRegister.successMsg);
      navigate({ to: "/user/dashboard" });
    } catch {
      toast.error(d.userRegister.errorMsg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-base)] px-4">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="mb-6 flex items-center gap-1 text-xs text-[color:var(--color-cream)]/40 hover:text-[color:var(--color-cream)]/80 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {d.userRegister.back}
        </button>

        <p className="eyebrow text-[color:var(--color-signal)]">{d.userRegister.eyebrow}</p>
        <h1 className="display-md mt-1 text-[color:var(--color-cream)]">{d.userRegister.title}</h1>
        <p className="mt-2 text-sm text-[color:var(--color-cream)]/60">{d.userRegister.subtitle}</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[color:var(--color-cream)]/80">
                    {d.userRegister.phoneLabel}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder={d.userRegister.phonePlaceholder}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      className="bg-[var(--color-bg-elevated)] text-[color:var(--color-cream)] placeholder:text-[color:var(--color-cream)]/30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referralCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[color:var(--color-cream)]/80">
                    {d.userRegister.referralLabel}{" "}
                    <span className="text-[color:var(--color-cream)]/40">
                      {d.userRegister.referralOptional}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={d.userRegister.referralPlaceholder}
                      className="bg-[var(--color-bg-elevated)] text-[color:var(--color-cream)] placeholder:text-[color:var(--color-cream)]/30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="btn-signal w-full"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                d.userRegister.submit
              )}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-xs text-[color:var(--color-cream)]/40">
          {d.userRegister.ownerCta}{" "}
          <Link to="/signup" className="text-[color:var(--color-signal)] underline">
            {d.userRegister.ownerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
