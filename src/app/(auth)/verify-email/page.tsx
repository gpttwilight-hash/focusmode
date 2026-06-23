import { VerifyEmailForm } from "./VerifyEmailForm";

type Props = {
  searchParams: Promise<{
    email?: string | string[];
  }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = Array.isArray(params.email) ? params.email[0] || "" : params.email || "";

  return <VerifyEmailForm email={email} />;
}
