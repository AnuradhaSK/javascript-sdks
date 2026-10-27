// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * The languages the server holds translations for.
 */
export interface LanguageListResponse {
  languages?: string[];
}

/**
 * Translations keyed by namespace, then by key.
 */
export type TranslationsByNamespace = Record<string, Record<string, string>>;

/**
 * The translations of one language.
 */
export interface LanguageTranslationsResponse {
  language: string;
  totalResults?: number;
  translations: TranslationsByNamespace;
}

/**
 * The payload used to set the translations of a language.
 */
export interface SetTranslationsRequest {
  translations: TranslationsByNamespace;
}

/**
 * One translation.
 */
export interface ManagedTranslation {
  key: string;
  language: string;
  namespace: string;
  value: string;
}

/**
 * The payload used to set one translation.
 */
export interface SetTranslationRequest {
  value: string;
}
