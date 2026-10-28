// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import AdministrationModes, {
  AdministrationFlowConfigKey,
  AdministrationFlowInput,
} from '../../../constants/AdministrationConstants';
import {AdministrationOptions} from '../../../models/administration';
import {ManagementRequestConfig} from '../../../models/api';
import getGroup from './getGroup';
import {Group, GroupMember} from '../../../models/group';
import requestManagementResource from '../../../utils/requestManagementResource';
import executeAdministrationFlow from '../administration/executeAdministrationFlow';
import resolveAdministrationFlowId from '../administration/resolveAdministrationFlowId';

export interface RemoveGroupMembersConfig extends ManagementRequestConfig, AdministrationOptions {
  /**
   * Identifier of the group to remove members from.
   */
  groupId: string;
  /**
   * The identities to remove.
   */
  members: Pick<GroupMember, 'id' | 'type'>[];
}

/**
 * Removes members from a group and returns the group. In `flow` mode the configured membership removal
 * flow runs once for each member instead, revoking what the member held through the group, and the
 * group is read afterwards.
 */
const removeGroupMembers = async ({
  administrationMode,
  groupId,
  members,
  ...config
}: RemoveGroupMembersConfig): Promise<Group> => {
  if (administrationMode === AdministrationModes.FLOW) {
    const flowId: string | null = await resolveAdministrationFlowId(
      config,
      AdministrationFlowConfigKey.GROUP_MEMBERSHIP_REMOVAL,
      'group membership removal',
    );

    if (flowId) {
      for (const member of members) {
        await executeAdministrationFlow(
          config,
          flowId,
          {[AdministrationFlowInput.GROUP]: groupId, [AdministrationFlowInput.MEMBER]: member.id},
          'group membership removal',
        );
      }

      return getGroup({...config, groupId});
    }
  }

  return requestManagementResource<Group>(config, {
    body: {members},
    collection: 'groups',
    failureMessage: 'Failed to remove group members',
    id: groupId,
    method: 'POST',
    operation: 'removeGroupMembers',
    subPath: 'members/remove',
  });
};

export default removeGroupMembers;
