// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {AgentType} from './agent-resource';
import {ManagedUserType} from './managed-user-type';

interface BasePropertyDefinition {
  displayName?: string;
  required?: boolean;
  unique?: boolean;
}

/**
 * A text attribute. `email` and `mobile` are text with a known format.
 */
export interface StringPropertyDefinition extends BasePropertyDefinition {
  credential?: boolean;
  enum?: string[];
  regex?: string;
  type: 'string' | 'email' | 'mobile';
}

export interface NumberPropertyDefinition extends BasePropertyDefinition {
  credential?: boolean;
  type: 'number';
}

export interface BooleanPropertyDefinition extends BasePropertyDefinition {
  type: 'boolean';
}

export interface ObjectPropertyDefinition extends BasePropertyDefinition {
  properties: Record<string, PropertyDefinition>;
  type: 'object';
}

/**
 * What each item of an array attribute holds.
 */
export type ArrayItemDefinition =
  | {enum?: string[]; type: 'string' | 'email' | 'mobile' | 'number' | 'boolean'}
  | {properties: Record<string, PropertyDefinition>; type: 'object'};

export interface ArrayPropertyDefinition extends BasePropertyDefinition {
  items: ArrayItemDefinition;
  type: 'array';
}

/**
 * One attribute of a user type or an agent type.
 */
export type PropertyDefinition =
  | StringPropertyDefinition
  | NumberPropertyDefinition
  | BooleanPropertyDefinition
  | ObjectPropertyDefinition
  | ArrayPropertyDefinition;

/**
 * The attributes of a user type or an agent type, keyed by attribute name.
 */
export type EntityTypeSchema = Record<string, PropertyDefinition>;

/**
 * The attributes a type maps to the identity's display name and primary contacts.
 */
export interface EntityTypeSystemAttributes {
  display?: string;
  primaryEmail?: string;
  primaryMobile?: string;
}

/**
 * A user type with its attribute schema.
 */
export interface ManagedUserTypeDetails extends ManagedUserType {
  allowSelfRegistration: boolean;
  displayName: string;
  ouId: string;
  schema: EntityTypeSchema;
  systemAttributes?: EntityTypeSystemAttributes;
}

export interface CreateUserTypeRequest {
  allowSelfRegistration?: boolean;
  displayName: string;
  handle: string;
  ouId: string;
  schema: EntityTypeSchema;
  systemAttributes?: EntityTypeSystemAttributes;
}

export type UpdateUserTypeRequest = Omit<CreateUserTypeRequest, 'handle'>;

/**
 * An agent type with its attribute schema.
 */
export interface AgentTypeDetails extends AgentType {
  schema: EntityTypeSchema;
  systemAttributes?: Pick<EntityTypeSystemAttributes, 'display'>;
}

export interface UpdateAgentTypeRequest {
  displayName: string;
  ouId: string;
  schema: EntityTypeSchema;
  systemAttributes?: Pick<EntityTypeSystemAttributes, 'display'>;
}

/**
 * The payload used to create the agent type. The server holds a single agent type, whose handle is
 * `default`.
 */
export interface CreateAgentTypeRequest extends UpdateAgentTypeRequest {
  allowSelfRegistration?: boolean;
  handle: string;
}
