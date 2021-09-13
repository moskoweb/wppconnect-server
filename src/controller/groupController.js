/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { contactToArray, groupToArray, unlinkAsync, getGroupId, sleep } from '../util/functions';

function returnSucess(res, group, data, message = 'Information retrieved successfully.') {
  res.status(200).json({
    status: 'success',
    response: {
      message: message,
      group: group,
      data: data,
    },
  });
}

function returnError(req, res, error, messsage = 'Error retrieving information') {
  req.logger.error(error);
  res.status(400).json({
    status: 'error',
    response: {
      message: messsage,
      log: error,
    },
  });
}

export async function joinGroupByCode(req, res) {
  const { inviteCode } = req.body;

  if (!inviteCode) return returnError(req, res, 'Invitation Code is required');

  try {
    let result;

    result = await req.client.joinGroup(inviteCode);

    returnSucess(res, inviteCode, result, 'The informed contact(s) entered the group successfully');
  } catch (error) {
    returnError(req, res, 'The informed contact(s) did not join the group successfully');
  }
}

export async function getAllGroups(req, res) {
  try {
    let result;

    result = await req.client.getAllGroups();

    returnSucess(res, 'all-groups', result);
  } catch (e) {
    returnError(req, res, 'Error fetching groups');
  }
}

export async function createGroup(req, res) {
  const { participants, name } = req.body;

  try {
    let group;
    let link;
    let infoGroup = [];

    group = await req.client.createGroup(name, contactToArray(participants));

    await sleep(500);

    link = await req.client.getGroupInviteLink(getGroupId(group.gid.user));

    infoGroup.push({
      id: group.gid.user,
      name: name,
      link: link,
      participants: group.participants.map((user) => {
        return { user: Object.keys(user)[0] };
      }),
    });

    returnSucess(res, group.gid.user, infoGroup, 'Group(s) created successfully');
  } catch (e) {
    returnError(req, res, 'Error creating group');
  }
}

export async function leaveGroup(req, res) {
  const { groupId } = req.body;

  try {
    for (const group of groupToArray(groupId)) {
      await req.client.leaveGroup(group);
    }

    return res.status(200).json({
      status: 'success',
      response: { messages: 'Você saiu do grupo com sucesso', group: groupId },
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Erro ao sair do(s) grupo(s)' });
  }
}

export async function getGroupMembers(req, res) {
  const { groupId } = req.params;

  try {
    let response = {};
    for (const group of groupToArray(groupId)) {
      response = await req.client.getGroupMembers(group);
    }
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on get group members' });
  }
}

export async function addParticipant(req, res) {
  const { groupId, phone } = req.body;

  try {
    let response = {};
    let arrayGroups = [];

    response = await req.client.addParticipant(getGroupId(groupId), contactToArray(phone));

    returnSucess(res, groupId, response);
  } catch (e) {
    returnError(req, res, 'Error adding participant(s)');
  }
}

export async function removeParticipant(req, res) {
  const { groupId, phone } = req.body;

  try {
    let response = {};
    let arrayGroups = [];

    for (const group of groupToArray(groupId)) {
      response = await req.client.removeParticipant(group, contactToArray(phone));
      arrayGroups.push(response);
    }

    return res.status(200).json({
      status: 'success',
      response: { message: 'Participant(s) removed successfully', participants: phone, groups: arrayGroups },
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error removing participant(s)' });
  }
}

export async function promoteParticipant(req, res) {
  const { groupId, phone } = req.body;

  try {
    response = await req.client.promoteParticipant(getGroupId(groupId), contactToArray(phone));

    returnSucess(res, groupId, response);
  } catch (e) {
    returnError(req, res, 'Error promoting participant(s)');
  }
}

export async function demoteParticipant(req, res) {
  const { groupId, phone } = req.body;

  try {
    let arrayGroups = [];
    for (const group of groupToArray(groupId)) {
      await req.client.demoteParticipant(group, contactToArray(phone));
      arrayGroups.push(group);
    }

    return res.status(201).json({
      status: 'success',
      response: { message: 'Admin of participant(s) revoked successfully', participants: phone, groups: arrayGroups },
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: "Error revoking participant's admin(s)" });
  }
}

export async function getGroupAdmins(req, res) {
  const { groupId } = req.params;

  try {
    let response;
    let arrayGroups = [];

    for (const group of groupToArray(groupId)) {
      response = await req.client.getGroupAdmins(group);
      arrayGroups.push(response);
    }

    returnSucess(res, groupId, arrayGroups);
  } catch (e) {
    returnError(req, res, 'Error retrieving group admin(s)');
  }
}

export async function getGroupInviteLink(req, res) {
  const { groupId } = req.params;

  try {
    let response;

    response = await req.client.getGroupInviteLink(getGroupId(groupId));

    returnSucess(res, groupId, response);
  } catch (e) {
    returnError(req, res, 'Error on get group invite link');
  }
}

export async function revokeGroupInviteLink(req, res) {
  const { groupId } = req.params;

  try {
    let response = {};

    response = await req.client.revokeGroupInviteLink(getGroupId(groupId));

    returnSucess(res, groupId, response);
  } catch (e) {
    returnError(req, res, 'Error on revoke group invite link');
  }
}

export async function getAllBroadcastList(req, res) {
  try {
    let response = await req.client.getAllBroadcastList();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on get all broad cast list' });
  }
}

export async function getGroupInfoFromInviteLink(req, res) {
  try {
    const { invitecode } = req.body;
    let response = await req.client.getGroupInfoFromInviteLink(invitecode);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on get group info from invite link' });
  }
}

export async function getGroupMembersIds(req, res) {
  const { groupId } = req.params;
  let response = {};
  try {
    for (const group of groupToArray(groupId)) {
      response = await req.client.getGroupMembersIds(group);
    }
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on get group members ids' });
  }
}

export async function setGroupDescription(req, res) {
  const { groupId, description } = req.body;

  let response = {};

  try {
    for (const group of groupToArray(groupId)) {
      response = await req.client.setGroupDescription(group, description);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on set group description' });
  }
}

export async function setGroupProperty(req, res) {
  const { groupId, property, value = true } = req.body;

  let response = {};

  try {
    for (const group of groupToArray(groupId)) {
      response = await req.client.setGroupProperty(group, property, value);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on set group property' });
  }
}

export async function setGroupSubject(req, res) {
  const { groupId, title } = req.body;

  let response = {};

  try {
      response = await req.client.setGroupSubject(getGroupId(groupId), title);

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on set group subject' });
  }
}

export async function setMessagesAdminsOnly(req, res) {
  const { groupId, value = true } = req.body;

  let response = {};

  try {
    for (const group of groupToArray(groupId)) {
      response = await req.client.setMessagesAdminsOnly(group, value);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on set messages admins only' });
  }
}

export async function changePrivacyGroup(req, res) {
  const { groupId, status } = req.body;

  try {
    let result;
    for (const group of contactToArray(groupId)) {
      result = await req.client.setMessagesAdminsOnly(group, status === 'true');
    }

    returnSucess(res, groupId, result, 'Group privacy changed successfully');
  } catch (e) {
    returnError(req, res, 'Error changing group privacy');
  }
}

export async function setGroupProfilePic(req, res) {
  const { phone } = req.body;

  if (!req.file) return res.status(400).json({ status: 'error', message: 'File parameter is required!' });

  try {
    const { path: pathFile } = req.file;

    let result;

    result = await req.client.setProfilePic(pathFile, phone);

    await unlinkAsync(pathFile);

    returnSucess(res, phone, result, 'Group profile photo successfully changed');
  } catch (e) {
    returnError(req, res, 'Error changing group photo');
  }
}
