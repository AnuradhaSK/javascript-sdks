// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

/**
 * Who made a change.
 */
export interface ConfigurationActor {
  id: string;
  name: string;
}

/**
 * A place in the configuration that refers to a variable or a secret by name.
 */
export interface ConfigurationValueReference {
  field?: string;
  kind?: 'variable' | 'secret';
  list?: boolean;
  name?: string;
  resourceId?: string;
  resourceName?: string;
  resourceType?: string;
}

/**
 * A captured version of the configuration.
 */
export interface ConfigurationVersion {
  createdAt?: string;
  createdBy?: ConfigurationActor;
  current?: boolean;
  name?: string;
  note?: string;
  number?: number;
  references?: ConfigurationValueReference[];
  /**
   * The captured resources, as a declarative document.
   */
  resources?: string;
  skipped?: {code?: string; error?: string; resourceId?: string; resourceType?: string}[];
  unchanged?: boolean;
  version?: string;
}

/**
 * The payload used to capture a configuration version.
 */
export interface CaptureConfigurationVersionRequest {
  current?: boolean;
  name?: string;
  note?: string;
}

/**
 * Options of a configuration export.
 */
export interface ConfigurationExportOptions {
  folderStructure?: {
    customStructure?: Record<string, string>;
    fileNamingPattern?: string;
    groupByType?: boolean;
  };
  format?: 'yaml';
  includeDependencies?: boolean;
  includeMetadata?: boolean;
  pagination?: {limit?: number; page?: number};
}

/**
 * The payload used to export resources. Each list names the identifiers of that resource type to export.
 */
export interface ConfigurationExportRequest {
  agentTypes?: string[];
  applications?: string[];
  authorizationDetailTypes?: string[];
  connections?: string[];
  credentialConfigurations?: string[];
  flows?: string[];
  groups?: string[];
  layouts?: string[];
  notificationTemplates?: string[];
  options?: ConfigurationExportOptions;
  organizationUnits?: string[];
  presentationDefinitions?: string[];
  resourceServers?: string[];
  roles?: string[];
  themes?: string[];
  translations?: string[];
  userTypes?: string[];
  users?: string[];
}

/**
 * The exported resources, as a declarative document, and the environment variables it refers to.
 */
export interface ConfigurationExportResponse {
  environment_variables: string;
  resources: string;
}

/**
 * A runtime resource to remove during an import.
 */
export interface ConfigurationResourceDeletion {
  id: string;
  resourceType: string;
}

/**
 * Options of a configuration import.
 */
export interface ConfigurationImportOptions {
  continueOnError?: boolean;
  target?: 'runtime';
  upsert?: boolean;
}

/**
 * The payload used to import declarative resources. It carries `content` to upsert, `deletions` to
 * remove, or both.
 */
export interface ConfigurationImportRequest {
  /**
   * One or more YAML documents separated by `---`.
   */
  content?: string;
  deletions?: ConfigurationResourceDeletion[];
  /**
   * Validates the content and returns the expected outcomes without changing anything.
   */
  dryRun?: boolean;
  options?: ConfigurationImportOptions;
  /**
   * Values for the `{{.VARIABLE_NAME}}` template variables in `content`.
   */
  variables?: Record<string, unknown>;
}

/**
 * The outcome of one imported resource.
 */
export interface ConfigurationImportOutcome {
  code?: string;
  message?: string;
  operation?: 'create' | 'update';
  resourceId?: string;
  resourceName?: string;
  resourceType: string;
  status: 'success' | 'failed';
}

/**
 * The outcome of an import.
 */
export interface ConfigurationImportResponse {
  results: ConfigurationImportOutcome[];
  summary: {
    deleted?: number;
    failed: number;
    importedAt: string;
    imported: number;
    totalDocuments: number;
  };
}

/**
 * The payload used to delete an imported declarative resource file.
 */
export interface DeleteImportedConfigurationRequest {
  resourceKey: string;
  resourceType: string;
}

/**
 * The outcome of deleting an imported declarative resource file.
 */
export interface DeleteImportedConfigurationResponse {
  deletedFile: string;
  resourceKey: string;
  resourceType: string;
}
