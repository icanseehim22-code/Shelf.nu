import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import { data, redirect, useActionData } from "react-router";
import { useZorm } from "react-zorm";
import { z } from "zod";
import { Form } from "~/components/custom-form";
import Input from "~/components/forms/input";
import { ShelfOTP } from "~/components/forms/otp-input";
import PasswordInput from "~/components/forms/password-input";
import { Button } from "~/components/shared/button";
import { db } from "~/database/db.server";
import { useSearchParams } from "~/hooks/search-params";
import { useDisabled } from "~/hooks/use-disabled";
import { getSupabaseAdmin } from "~/integrations/supabase/client";

import {
  sendResetPasswordLink,
  updateAccountPassword,
} from "~/modules/auth/service.server";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import {
  makeEstoqueSoftSystemError,
  EstoqueSoftSystemError,
} from "~/utils/error";
import {
  payload,
  error,
  getCurrentSearchParams,
  parseData,
  readFormData,
} from "~/utils/http.server";
import { validEmail } from "~/utils/misc";

const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .transform((email) => email.toLowerCase())
    .refine(validEmail, () => ({
      message: "Insira um e-mail válido",
    })),
});

const OtpSchema = z
  .object({
    otp: z.string().min(6, "O código OTP é obrigatório."),
    email: z.string().transform((email) => email.toLowerCase()),
    password: z.string().min(8, "Senha muito curta. Mínimo de 8 caracteres."),
    confirmPassword: z
      .string()
      .min(8, "Senha muito curta. Mínimo de 8 caracteres."),
  })
  .superRefine(({ password, confirmPassword, otp, email }, ctx) => {
    if (password !== confirmPassword) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A senha e a confirmação devem ser iguais",
        path: ["confirmPassword"],
      });
    }

    return { password, confirmPassword, otp, email };
  });

export function loader({ context, request }: LoaderFunctionArgs) {
  const searchParams = getCurrentSearchParams(request);

  const title = "Esqueceu a senha?";
  const subHeading =
    searchParams.has("email") && searchParams.get("email") !== ""
      ? "Etapa 2 de 2: Insira o código e sua nova senha"
      : "Etapa 1 de 2: Insira seu e-mail";

  if (context.isAuthenticated) {
    return redirect("/assets");
  }

  return data(payload({ title, subHeading }));
}

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const { intent } = parseData(
      await readFormData(request.clone()),
      z.object({ intent: z.enum(["request-otp", "confirm-otp"]) }),
      {
        message:
          "Requisição inválida. Tente novamente. Se o problema persistir, contate o suporte.",
        shouldBeCaptured: false,
      }
    );

    switch (intent) {
      case "request-otp": {
        const { email } = parseData(
          await readFormData(request),
          ForgotPasswordSchema,
          { shouldBeCaptured: false }
        );

        /** We are going to get the user to make sure it exists and is confirmed
         * this will not allow the user to use the forgot password before they have confirmed their email
         */
        const user = await db.user.findFirst({
          where: { email },
          select: {
            id: true,
            sso: true,
          },
        });

        if (!user) {
          throw new EstoqueSoftSystemError({
            cause: null,
            message:
              "O usuário com este e-mail ainda não foi confirmado, então não é possível redefinir a senha. Confirme seu usuário antes de continuar",
            additionalData: { email },
            shouldBeCaptured: false,
            label: "Auth",
          });
        }

        if (user.sso) {
          throw new EstoqueSoftSystemError({
            cause: null,
            message:
              "Este usuário é um usuário SSO e não pode redefinir a senha por e-mail.",
            additionalData: { email },
            shouldBeCaptured: false,
            label: "Auth",
          });
        }

        await sendResetPasswordLink(email);

        return redirect("/forgot-password?email=" + email);
      }
      case "confirm-otp": {
        const { email, otp, password } = parseData(
          await readFormData(request.clone()),
          OtpSchema,
          { shouldBeCaptured: false }
        );

        // Attempt to verify the OTP
        const { data: otpData, error: verifyError } =
          await getSupabaseAdmin().auth.verifyOtp({
            email,
            token: otp,
            type: "recovery",
          });

        if (verifyError || !otpData.user || !otpData.session) {
          throw new EstoqueSoftSystemError({
            cause: verifyError,
            message: "Código de verificação inválido ou expirado",
            additionalData: { email, otp },
            label: "Auth",
            shouldBeCaptured: false,
          });
        }

        await updateAccountPassword(
          otpData.user.id,
          password,
          otpData.session.access_token
        );

        context.destroySession();
        return redirect("/login?password_reset=true");
      }
    }
  } catch (cause) {
    const reason = makeEstoqueSoftSystemError(cause);
    return data(error(reason), { status: reason.status });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? appendToMetaTitle(data.title) : "" },
];

export default function ForgotPassword() {
  const zo = useZorm("ForgotPasswordForm", ForgotPasswordSchema);
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const emailError =
    zo.errors.email()?.message || actionData?.error?.message || "";
  const disabled = useDisabled();

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full">
        {actionData?.error || !email || email === "" ? (
          <div>
            <p className="mb-4 text-center">
              Insira seu endereço de e-mail e enviaremos um código de uso único
              para redefinir sua senha.
            </p>
            <Form ref={zo.ref} method="post" className="space-y-2" replace>
              <input type="hidden" name="intent" value="request-otp" />
              <div>
                <Input
                  label="Endereço de e-mail"
                  data-test-id="email"
                  name={zo.fields.email()}
                  type="email"
                  autoComplete="email"
                  inputClassName="w-full"
                  placeholder="nome@exemplo.com"
                  disabled={disabled}
                  error={emailError}
                />
              </div>

              <Button
                data-test-id="send-password-reset-link"
                width="full"
                type="submit"
                disabled={disabled}
              >
                {!disabled ? "Redefinir senha" : "Enviando código..."}
              </Button>
            </Form>
            <p className="mt-2 text-center text-gray-500">
              Dica: confira sua caixa de spam se não encontrar o e-mail em
              alguns minutos.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2">
              Enviamos um código de 6 dígitos para{" "}
              <span className="font-semibold">{email}</span>.
            </p>
            <ol className="mb-4 list-inside list-decimal">
              <li>Insira o código do seu e-mail</li>
              <li>Insira sua nova senha</li>
              <li>Confirme sua nova senha</li>
            </ol>
            <PasswordResetForm email={email} />
          </>
        )}
        <div className="pt-4 text-center">
          {email ? (
            <Button variant="link" to={"/forgot-password"}>
              Solicitar novo código
            </Button>
          ) : (
            <Button variant="link" to={"/login"}>
              Voltar ao login
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordResetForm({ email }: { email: string }) {
  const zoReset = useZorm("ResetPasswordForm", OtpSchema);
  const disabled = useDisabled();
  const actionData = useActionData<typeof action>();
  return !email || email === "" || actionData?.error ? (
    <div>Algo deu errado. Atualize a página e tente novamente.</div>
  ) : (
    <Form method="post" ref={zoReset.ref} className="space-y-2">
      <ShelfOTP error={zoReset.errors.otp()?.message} />

      <PasswordInput
        label="Nova senha"
        data-test-id="password"
        name={zoReset.fields.password()}
        type="password"
        autoComplete="new-password"
        disabled={disabled}
        error={zoReset.errors.password()?.message}
        placeholder="********"
        required
      />
      <PasswordInput
        label="Confirmar nova senha"
        data-test-id="confirmPassword"
        name={zoReset.fields.confirmPassword()}
        type="password"
        autoComplete="new-password"
        disabled={disabled}
        error={zoReset.errors.confirmPassword()?.message}
        placeholder="********"
        required
      />

      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="intent" value="confirm-otp" />

      <Button
        data-test-id="create-account"
        type="submit"
        className="w-full "
        disabled={disabled}
      >
        Confirmar redefinição de senha
      </Button>
    </Form>
  );
}
