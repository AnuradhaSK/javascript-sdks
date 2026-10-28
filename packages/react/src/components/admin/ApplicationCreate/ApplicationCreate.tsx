// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {
  Application,
  ApplicationQueryKeys,
  createApplication,
  CreateApplicationRequest,
  getApplicationClientSecret,
  toCreateApplicationRequest,
  toManagementErrorMessage,
} from '@thunderid/browser';
import {FC, ReactElement, useState} from 'react';
import BaseApplicationCreate, {ApplicationCreateSubmission, BaseApplicationCreateProps} from './BaseApplicationCreate';
import useManagementEndpoint, {ManagementEndpoint} from '../../../hooks/management/useManagementEndpoint';
import useResourceMutation, {ResourceMutationResult} from '../../../hooks/management/useResourceMutation';
import useTranslation from '../../../hooks/useTranslation';
import useDefaultOuId from '../shared/useDefaultOuId';

export type ApplicationCreateProps = Omit<
  BaseApplicationCreateProps,
  'clientSecret' | 'error' | 'isSubmitting' | 'onSecretDismiss' | 'onSubmit'
> & {
  /**
   * Called with the created application. When the server returned a client secret, it is called once
   * the user has copied the secret, since the secret cannot be read again.
   */
  onCreated?: (application: Application) => void;
  /**
   * Organization unit the application is created in. Defaults to the signed-in user's organization unit.
   */
  ouId?: string;
};

/**
 * Creates an application with an OAuth client through the management API, and shows its client
 * secret once when the server returns one.
 *
 * The server guards applications with the root `system` permission, for reading and for changes alike;
 * it defines no application-specific permission. Gate the view and its actions on it with
 * `useGrantedPermissions().can('system')`.
 *
 * @example
 * ```tsx
 * <ApplicationCreate onCreated={(application) => navigate(`/applications/${application.id}`)} />
 * ```
 */
const ApplicationCreate: FC<ApplicationCreateProps> = ({
  onCreated,
  ouId,
  preferences,
  ...rest
}: ApplicationCreateProps): ReactElement => {
  const {t} = useTranslation(preferences?.i18n);
  const resolvedOuId: string | undefined = useDefaultOuId(ouId);
  const endpoint: ManagementEndpoint = useManagementEndpoint('applications');
  const [created, setCreated] = useState<{application: Application; secret: string} | null>(null);
  const [formKey, setFormKey] = useState<number>(0);
  const {error, isLoading, mutate}: ResourceMutationResult<Application, CreateApplicationRequest> = useResourceMutation(
    (payload: CreateApplicationRequest, fetcher) => createApplication({...endpoint, fetcher, payload}),
    () => [[ApplicationQueryKeys.APPLICATIONS]],
    {
      onSuccess: (application: Application): void => {
        const secret: string | undefined = getApplicationClientSecret(application);

        if (secret) {
          setCreated({application, secret});
        } else {
          onCreated?.(application);
        }
      },
    },
  );

  const handleSubmit = (submission: ApplicationCreateSubmission): void => {
    if (resolvedOuId) {
      void mutate(toCreateApplicationRequest(submission, resolvedOuId));
    }
  };

  const handleSecretDismiss = (): void => {
    if (created) {
      setCreated(null);
      setFormKey((key: number) => key + 1);
      onCreated?.(created.application);
    }
  };

  return (
    <BaseApplicationCreate
      key={formKey}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      clientSecret={created?.secret ?? null}
      onSecretDismiss={handleSecretDismiss}
      error={
        resolvedOuId
          ? toManagementErrorMessage(t, error, 'admin.applications.create.error')
          : t('admin.common.errors.no_ou')
      }
      preferences={preferences}
      {...rest}
    />
  );
};

export default ApplicationCreate;
