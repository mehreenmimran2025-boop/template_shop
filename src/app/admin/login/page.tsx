import AdminLoginForm from '@/components/AdminLoginForm';

export const metadata = { title: 'Admin sign in' };

export default function AdminLoginPage() {
  return (
    <div className="w-full max-w-md">
      <AdminLoginForm />
    </div>
  );
}
