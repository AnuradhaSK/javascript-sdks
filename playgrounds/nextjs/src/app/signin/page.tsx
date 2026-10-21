// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

'use client';

import {SignedIn, SignedOut, SignIn} from '@thunderid/nextjs';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ReactElement} from 'react';

/**
 * The app-native sign-in page. Set NEXT_PUBLIC_THUNDERID_SIGN_IN_URL=/signin to send
 * <SignInButton /> and protectRoute() here instead of to the ThunderID hosted page.
 */
const SignInPage = (): ReactElement => {
  const router = useRouter();

  return (
    <main className="pg-main" style={{alignItems: 'center'}}>
      <SignedIn>
        <div className="pg-warning" role="status">
          You are already signed in. <Link href="/">Back to the overview</Link>
        </div>
      </SignedIn>
      <SignedOut>
        <div style={{maxWidth: '100%', width: 400}}>
          <SignIn onSuccess={() => router.push('/')} />
        </div>
      </SignedOut>
    </main>
  );
};

export default SignInPage;
