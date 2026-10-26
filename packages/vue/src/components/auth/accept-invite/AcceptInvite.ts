// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {ThunderIDAPIError} from '@thunderid/browser';
import {type Component, type PropType, type SetupContext, type VNode, defineComponent, h} from 'vue';
import BaseAcceptInvite from './BaseAcceptInvite';
import type {AcceptInviteFlowResponse, BaseAcceptInviteRenderProps} from './BaseAcceptInvite';

export type AcceptInviteRenderProps = BaseAcceptInviteRenderProps;

/**
 * Helper to extract query parameters from URL.
 */
const getUrlParams = (): {flowId?: string; inviteToken?: string} => {
  if (typeof window === 'undefined') return {};
  const params: URLSearchParams = new URLSearchParams(window.location.search);
  return {
    flowId: params.get('flowId') || undefined,
    inviteToken: params.get('inviteToken') || undefined,
  };
};

/**
 * AcceptInvite — end-user component for accepting an invite and setting a password.
 *
 * Automatically extracts flowId and inviteToken from URL, validates the token,
 * and delegates rendering to BaseAcceptInvite.
 */
const AcceptInvite: Component = defineComponent({
  name: 'AcceptInvite',
  props: {
    baseUrl: {default: undefined, type: String},
    className: {default: '', type: String},
    flowId: {default: undefined, type: String},
    inviteToken: {default: undefined, type: String},
    onComplete: {default: undefined, type: Function as PropType<() => void>},
    onError: {default: undefined, type: Function as PropType<(error: Error) => void>},
    onFlowChange: {
      default: undefined,
      type: Function as PropType<(response: AcceptInviteFlowResponse) => void>,
    },
    onGoToSignIn: {default: undefined, type: Function as PropType<() => void>},
    showSubtitle: {default: true, type: Boolean},
    showTitle: {default: true, type: Boolean},
    size: {default: 'medium', type: String as PropType<'small' | 'medium' | 'large'>},
    variant: {default: 'outlined', type: String as PropType<'outlined' | 'elevated'>},
  },
  setup(props: any, {slots}: SetupContext): () => VNode | null {
    const urlParams: {flowId?: string; inviteToken?: string} = getUrlParams();
    const flowId: string | undefined = props.flowId || urlParams.flowId;
    const inviteToken: string | undefined = props.inviteToken || urlParams.inviteToken;

    const apiBaseUrl: string = props.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');

    const handleSubmit = async (payload: Record<string, any>): Promise<AcceptInviteFlowResponse> => {
      const response: Response = await fetch(`${apiBaseUrl}/flow/execute`, {
        body: JSON.stringify({...payload, verbose: true}),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorText: string = await response.text();
        // ThunderIDAPIError resolves the raw API body into a readable message instead of leaking it.
        throw new ThunderIDAPIError(
          errorText,
          'AcceptInvite-ResponseError-001',
          'vue',
          response.status,
          response.statusText,
        );
      }

      return response.json();
    };

    return (): VNode | null =>
      h(
        BaseAcceptInvite,
        {
          className: props.className,
          flowId,
          inviteToken,
          onComplete: props.onComplete,
          onError: props.onError,
          onFlowChange: props.onFlowChange,
          onGoToSignIn: props.onGoToSignIn,
          onSubmit: handleSubmit,
          showSubtitle: props.showSubtitle,
          showTitle: props.showTitle,
          size: props.size,
          variant: props.variant,
        },
        slots['default'] ? {default: (renderProps: any) => slots['default']!(renderProps)} : undefined,
      );
  },
});

export default AcceptInvite;
