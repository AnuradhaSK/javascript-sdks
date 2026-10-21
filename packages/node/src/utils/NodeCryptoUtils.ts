// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {Crypto, JWKInterface} from '@thunderid/javascript';
import base64url from 'base64url';
import sha256 from 'fast-sha256';
import type {CryptoKey} from 'jose';
// Subpath imports keep jose's JWE code, whose CompressionStream use the Edge runtime rejects, out of the bundle.
import {importJWK} from 'jose/key/import';
import {jwtVerify} from 'jose/jwt/verify';
import randombytes from 'secure-random-bytes';

/**
 * Node.js crypto utilities implementing the `Crypto` interface.
 * Uses `jose`, `base64url`, `fast-sha256`, and `secure-random-bytes`.
 */
class NodeCryptoUtils implements Crypto<Buffer | string> {
  public base64URLEncode(value: Buffer | string): string {
    return base64url.encode(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  public base64URLDecode(value: string): string {
    return base64url.decode(value).toString();
  }

  public hashSha256(data: string): string | Buffer {
    return Buffer.from(sha256(new TextEncoder().encode(data)));
  }

  public generateRandomBytes(length: number): string | Buffer {
    return randombytes(length);
  }

  public async verifyJwt(
    idToken: string,
    jwk: Partial<JWKInterface>,
    algorithms: string[],
    clientId: string,
    issuer: string,
    subject: string,
    clockTolerance?: number,
  ): Promise<boolean> {
    const key: CryptoKey | Uint8Array = await importJWK(jwk);
    return jwtVerify(idToken, key, {
      algorithms,
      audience: [clientId],
      clockTolerance,
      issuer,
      subject,
    }).then(() => Promise.resolve(true));
  }
}

export default NodeCryptoUtils;
