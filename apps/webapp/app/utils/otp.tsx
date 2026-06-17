import type { FC } from "react";
import SubHeading from "~/components/shared/sub-heading";

export type OtpVerifyMode = "login" | "signup" | "confirm_signup";

export type OtpPageData = Record<
  OtpVerifyMode,
  {
    title: string;
    SubHeading: FC<{ email: string }>;
    buttonTitle: string;
  }
>;

export const OTP_PAGE_MAP: OtpPageData = {
  login: {
    title: "Digite seu código",
    SubHeading: ({ email }) => (
      <SubHeading className="-mt-4 text-center">
        Enviamos um código para{" "}
        <span className="font-bold text-gray-900">{email}</span>. Digite o
        código abaixo para entrar.
      </SubHeading>
    ),
    buttonTitle: "Entrar",
  },
  signup: {
    title: "Criar uma conta",
    SubHeading: () => (
      <SubHeading className="-mt-4 text-center">
        Comece sua jornada com o EstoqueSoftSystem.
      </SubHeading>
    ),
    buttonTitle: "Criar conta",
  },
  confirm_signup: {
    title: "Confirme seu e-mail",
    SubHeading: ({ email }) => (
      <SubHeading className="-mt-4 text-center">
        Enviamos um código para{" "}
        <span className="font-bold text-gray-900">{email}</span>. Digite o
        código abaixo para confirmar seu e-mail.
      </SubHeading>
    ),
    buttonTitle: "Confirmar",
  },
};

export const DEFAULT_PAGE_DATA: OtpPageData["login"] = {
  title: "Senha de Uso Único",
  buttonTitle: "Continuar",
  SubHeading: () => (
    <SubHeading className="-mt-4 text-center">
      Confirme seu código OTP para continuar
    </SubHeading>
  ),
};

export function getOtpPageData(mode: OtpVerifyMode) {
  return OTP_PAGE_MAP[mode] ?? DEFAULT_PAGE_DATA;
}
