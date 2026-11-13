import AuthForm from '@/components/AuthForm';

export const metadata = { title: 'Sign in' };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = searchParams.next && searchParams.next.startsWith('/') ? searchParams.next : '/library';
  return (
    <div className="container-x flex justify-center py-20">
      <AuthForm mode="login" next={next} />
    </div>
  );
}
