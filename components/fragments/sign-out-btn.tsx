'use client';

import { authClient } from '@/lib/auth/auth-client';
import { DropdownMenuItem } from '../ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export const SignOutButton = () => {
  const router = useRouter();

  return (
    <DropdownMenuItem
      className="cursor-pointer"
      onClick={async () => {
        const result = await authClient.signOut();
        if (result.data) {
          router.push('/sign-in');
        } else {
          alert('Error signing out');
        }
      }}
    >
      Sign Out
    </DropdownMenuItem>
  );
};

export default SignOutButton;
