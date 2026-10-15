// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import generateStateParamForRequestCorrelation from './generateStateParamForRequestCorrelation';
import OIDCRequestConstants from '../constants/OIDCRequestConstants';
import ThunderIDRuntimeError from '../errors/ThunderIDRuntimeError';
import {ExtendedAuthorizeRequestUrlParams} from '../models/oauth-request';

/**
 * Generates a map of authorization request URL parameters for OIDC authorization requests.
 *
 * This utility ensures the `openid` scope is always included, handles both string and array forms of the `scope` parameter,
 * and supports PKCE and custom parameters. Throws if a code challenge is provided without a code challenge method.
 *
 * @param options - The main options for the authorization request, including redirectUri, clientId, scope, responseMode, codeChallenge, codeChallengeMethod, and prompt.
 * @param pkceOptions - PKCE options, including the PKCE key for state correlation.
 * @param customParams - Optional custom parameters to include in the request (excluding the `state` param, which is handled separately).
 * @returns A Map of key-value pairs representing the authorization request URL parameters.
 *
 * @throws {ThunderIDRuntimeError} If a code challenge is provided without a code challenge method.
 *
 * @example
 * const params = getAuthorizeRequestUrlParams({
 *   options: {
 *     redirectUri: 'https://app/callback',
 *     clientId: 'client123',
 *     scope: ['openid', 'profile'],
 *     responseMode: 'query',
 *     codeChallenge: 'abc',
 *     codeChallengeMethod: 'S256',
 *     prompt: 'login'
 *   },
 *   pkceOptions: { key: 'pkce_code_verifier_1' },
 *   customParams: { foo: 'bar' }
 * });
 * // Returns a Map with all required OIDC params, PKCE, and custom params.
 */
const getAuthorizeRequestUrlParams = (
  options: {
    clientId: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    instanceId?: string;
    prompt?: string;
    redirectUri: string;
    responseMode?: string;
    scopes?: string;
  } & ExtendedAuthorizeRequestUrlParams,
  pkceOptions: {key: string},
  customParams: Record<string, string | number | boolean>,
): Map<string, string> => {
  const {redirectUri, clientId, scopes, responseMode, codeChallenge, codeChallengeMethod, prompt} = options;
  const authorizeRequestParams: Map<string, string> = new Map<string, string>();

  authorizeRequestParams.set('response_type', 'code');
  authorizeRequestParams.set('client_id', clientId);

  if (scopes !== undefined) {
    authorizeRequestParams.set('scope', scopes);
  }
  authorizeRequestParams.set('redirect_uri', redirectUri);

  if (responseMode) {
    authorizeRequestParams.set('response_mode', responseMode);
  }

  const pkceKey: string = pkceOptions?.key;

  if (codeChallenge) {
    authorizeRequestParams.set('code_challenge', codeChallenge);

    if (codeChallengeMethod) {
      authorizeRequestParams.set('code_challenge_method', codeChallengeMethod);
    } else {
      throw new ThunderIDRuntimeError(
        'Code challenge method is required when code challenge is provided.',
        'getAuthorizeRequestUrlParams-ValidationError-001',
        'javascript',
        'When PKCE is enabled, the code challenge method must be provided along with the code challenge.',
      );
    }
  }

  if (prompt) {
    authorizeRequestParams.set('prompt', prompt);
  }

  if (customParams) {
    Object.entries(customParams).forEach(([key, value]: [string, string | number | boolean]) => {
      if (key !== '' && value !== '' && key !== OIDCRequestConstants.Params.STATE) {
        authorizeRequestParams.set(key, value.toString());
      }
    });
  }

  const AUTH_INSTANCE_PREFIX = 'instance_';
  const customState: string = customParams?.[OIDCRequestConstants.Params.STATE]?.toString() ?? '';
  let customStateValue: string = customState;

  // Keep a caller-supplied state after the instance prefix rather than dropping it: the prefix routes
  // the callback to the right client instance, and the custom value marks the kind of request (for
  // example a silent sign-in) for the page that handles the callback.
  if (options.instanceId) {
    customStateValue = AUTH_INSTANCE_PREFIX + options.instanceId + (customState ? `_${customState}` : '');
  }

  authorizeRequestParams.set(
    OIDCRequestConstants.Params.STATE,
    generateStateParamForRequestCorrelation(pkceKey, customStateValue),
  );

  return authorizeRequestParams;
};

export default getAuthorizeRequestUrlParams;
