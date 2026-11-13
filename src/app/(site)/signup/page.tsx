import AuthForm from '@/components/AuthForm';

export const metadata = { title: 'Create account' };

export default function SignupPage({
  searchParams,
}: {
  searchParams: { next?: string; why?: string };
}) {
  const next = searchParams.next && searchParams.next.startsWith('/') ? searchParams.next : '/library';
  return (
    <div className="container-x flex flex-col items-center py-20">
      {searchParams.why === 'save' ? (
        <p className="mb-5 max-w-md rounded-xl border border-sand bg-sand-pale/70 px-5 py-3 text-center text-sm text-cocoa">
          Wishlists are saved to your account, so they are here next time.
        </p>
      ) : null}
      <AuthForm mode="signup" next={next} />
    </div>
  );
}
