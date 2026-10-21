// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import type {CryptoKey, JWK} from 'jose';
// Subpath imports keep jose's JWE code, whose CompressionStream use the Edge runtime rejects, out of the bundle.
import * as base64url from 'jose/base64url';
import {importJWK} from 'jose/key/import';
import {jwtVerify} from 'jose/jwt/verify';
import {Crypto, JWKInterface} from './models/crypto';

/**
 * Default implementation of the Crypto interface using the 'jose' library
 * and the native Web Crypto API.
 */
export class DefaultCrypto implements Crypto<Uint8Array> {
  public base64URLDecode(value: string): string {
    const decodedArray: Uint8Array = base64url.decode(value);
    return new TextDecoder().decode(decodedArray);
  }

  public base64URLEncode(value: Uint8Array): string {
    return base64url.encode(value);
  }

  public generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  public async hashSha256(data: string): Promise<Uint8Array> {
    const encoder: TextEncoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer: ArrayBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

    return new Uint8Array(hashBuffer);
  }

  public async verifyJwt(
    idToken: string,
    jwk: JWKInterface,
    algorithms: string[],
    clientId: string,
    issuer: string,
    subject: string,
    clockTolerance?: number,
    validateJwtIssuer = true,
  ): Promise<boolean> {
    const key: CryptoKey | Uint8Array = await importJWK(jwk as JWK);

    await jwtVerify(idToken, key, {
      algorithms,
      audience: [clientId],
      clockTolerance,
      issuer: validateJwtIssuer ? issuer : undefined,
      subject,
    });

    return true;
  }
}
