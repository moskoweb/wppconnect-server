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
import fs from 'fs';
import { download } from './sessionController';
import { contactToArray, unlinkAsync } from '../util/functions';
import mime from 'mime-types';

function returnSucess(res, session, phone, data, message = 'Information retrieved successfully.') {
  res.status(200).json({
    status: 'success',
    response: {
      message: message,
      contact: phone,
      session: session,
      data: data,
    },
  });
}

function returnError(req, res, session, error, messsage = 'Error retrieving information') {
  req.logger.error(error);
  res.status(400).json({
    status: 'error',
    response: {
      message: messsage,
      session: session,
      log: error,
    },
  });
}

export async function setProfileName(req, res) {
  const { name } = req.body;

  if (!name) return res.status(400).json({ status: 'error', message: 'Parameter name is required!' });

  try {
    const result = await req.client.setProfileName(name);
    return res.status(200).json({ status: 'success', response: result });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({ status: 'error', message: 'Error on set profile name.' });
  }
}

export async function showAllContacts(req, res) {
  try {
    const contacts = await req.client.getAllContacts();
    res.status(200).json({ status: 'success', response: contacts });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({ status: 'error', message: 'Error fetching contacts' });
  }
}

export async function getAllChats(req, res) {
  try {
    const response = await req.client.getAllChats();
    return res.status(200).json({ status: 'success', response: response, mapper: 'chat' });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on get all chats' });
  }
}

export async function getAllChatsWithMessages(req, res) {
  try {
    const response = await req.client.getAllChatsWithMessages();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(400).json({
      status: 'error',
      response: 'Error on get all chats whit messages',
    });
  }
}

export async function getAllMessagesInChat(req, res) {
  try {
    let { phone } = req.params;
    const { isGroup = false, includeMe = true, includeNotifications = true } = req.query;

    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      response = await req.client.getAllMessagesInChat(contato, includeMe, includeNotifications);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(401).json({ status: 'error', response: 'Error on get all messages in chat' });
  }
}

export async function getAllNewMessages(req, res) {
  try {
    const response = await req.client.getAllNewMessages();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(401).json({ status: 'error', response: 'Error on get all messages in chat' });
  }
}

export async function getAllUnreadMessages(req, res) {
  try {
    const response = await req.client.getAllUnreadMessages();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(401).json({ status: 'error', response: 'Error on get all messages in chat' });
  }
}

export async function getChatById(req, res) {
  const { phone } = req.params;
  const { isGroup } = req.query;

  try {
    let allMessages = {};

    if (isGroup) {
      allMessages = await req.client.getAllMessagesInChat(`${phone}@g.us`, true, true);
    } else {
      allMessages = await req.client.getAllMessagesInChat(`${phone}@c.us`, true, true);
    }

    let dir = './WhatsAppImages';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    allMessages.map((message) => {
      if (message.type === 'sticker') {
        download(message, req.client, req.logger);
        message.body = `${req.serverOptions.host}:${req.serverOptions.port}/files/file${message.t}.${mime.extension(
          message.mimetype
        )}`;
      }
    });

    return res.status(200).json({ status: 'success', response: allMessages });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error changing chat by Id' });
  }
}

export async function getMessageById(req, res) {
  const session = req.session;
  const { messageId } = req.params;

  try {
    let result;

    result = await req.client.getMessageById(messageId);

    returnSucess(res, session, result.chatId.user, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function changePrivacyGroup(req, res) {
  const { phone, status } = req.body;

  try {
    for (const contato of contactToArray(phone)) {
      await req.client.setMessagesAdminsOnly(`${contato}@g.us`, status === 'true');
    }

    return res.status(200).json({ status: 'success', response: { message: 'Group privacy changed successfully' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error changing group privacy' });
  }
}

export async function getBatteryLevel(req, res) {
  try {
    let response = await req.client.getBatteryLevel();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error retrieving battery status' });
  }
}

export async function getHostDevice(req, res) {
  try {
    const response = await req.client.getHostDevice();
    return res.status(200).json({ status: 'success', response: response, mapper: 'device' });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Erro ao recuperar dados do telefone' });
  }
}

export async function getBlockList(req, res) {
  let response = await req.client.getBlockList();

  try {
    const blocked = response.map((contato) => {
      return { phone: contato ? contato.split('@')[0] : '' };
    });

    return res.status(200).json({ status: 'success', response: blocked });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error retrieving blocked contact list' });
  }
}

export async function deleteChat(req, res) {
  const { phone, isGroup = false } = req.body;

  try {
    if (isGroup) {
      await req.client.deleteChat(`${phone}@g.us`);
    } else {
      await req.client.deleteChat(`${phone}@c.us`);
    }
    return res.status(200).json({ status: 'success', response: { message: 'Conversa deleteada com sucesso' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Erro ao deletada conversa' });
  }
}

export async function clearChat(req, res) {
  const { phone, isGroup = false } = req.body;

  try {
    if (isGroup) {
      await req.client.clearChat(`${phone}@g.us`);
    } else {
      await req.client.clearChat(`${phone}@c.us`);
    }
    return res.status(200).json({ status: 'success', response: { message: 'Successfully cleared conversation' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error clearing conversation' });
  }
}

export async function archiveChat(req, res) {
  const { phone, value = true, isGroup = false } = req.body;

  try {
    let response;
    if (isGroup) {
      response = await req.client.archiveChat(`${phone}@g.us`, value);
    } else {
      response = await req.client.archiveChat(`${phone}@c.us`, value);
    }
    return res.status(201).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on archive chat' });
  }
}

export async function deleteMessage(req, res) {
  const { phone, messageId } = req.body;

  try {
    await req.client.deleteMessage(`${phone}@c.us`, [messageId]);

    return res.status(200).json({ status: 'success', response: { message: 'Message deleted' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on delete message' });
  }
}

export async function reply(req, res) {
  const { phone, text, messageid } = req.body;

  try {
    let response = await req.client.reply(`${phone}@c.us`, text, messageid);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error replying message' });
  }
}

export async function forwardMessages(req, res) {
  const { phone, messageId, isGroup = false } = req.body;

  try {
    let response;
    if (!isGroup) {
      response = await req.client.forwardMessages(`${phone}@c.us`, [messageId], false);
    } else {
      response = await req.client.forwardMessages(`${phone}@g.us`, [messageId], false);
    }

    return res.status(201).json({
      status: 'success',
      response: {
        id: response.to._serialized,
        session: req.session,
        phone: response.to.remote.user,
      },
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error forwarding message' });
  }
}

export async function markUnseenMessage(req, res) {
  const { phone, isGroup = false } = req.body;

  try {
    if (isGroup) {
      await req.client.markUnseenMessage(`${phone}@g.us`);
    } else {
      await req.client.markUnseenMessage(`${phone}@c.us`);
    }
    return res.status(200).json({ status: 'success', response: { message: 'unseen checked' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on mark unseen' });
  }
}

export async function blockContact(req, res) {
  const { phone } = req.body;

  try {
    await req.client.blockContact(`${phone}@c.us`);
    return res.status(200).json({ status: 'success', response: { message: 'Contact blocked' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on block contact' });
  }
}

export async function unblockContact(req, res) {
  const { phone } = req.body;

  try {
    await req.client.unblockContact(`${phone}@c.us`);
    return res.status(200).json({ status: 'success', response: { message: 'Contact UnBlocked' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on unlock contact' });
  }
}

export async function pinChat(req, res) {
  const { phone, state, isGroup = false } = req.body;

  try {
    if (isGroup) {
      await req.client.pinChat(`${phone}@g.us`, state === 'true', false);
    } else {
      await req.client.pinChat(`${phone}@c.us`, state === 'true', false);
    }

    return res.status(200).json({ status: 'success', response: { message: 'Chat fixed' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on pin chat' });
  }
}

export async function setProfilePic(req, res) {
  if (!req.file) return res.status(400).json({ status: 'error', message: 'File parameter is required!' });

  try {
    const { path: pathFile } = req.file;

    await req.client.setProfilePic(pathFile);
    await unlinkAsync(pathFile);

    return res.status(200).json({ status: 'success', response: { message: 'Profile photo successfully changed' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error changing profile photo' });
  }
}

export async function setGroupProfilePic(req, res) {
  const { phone } = req.body;

  if (!req.file) return res.status(400).json({ status: 'error', message: 'File parameter is required!' });

  try {
    const { path: pathFile } = req.file;

    for (const contato of contactToArray(phone, true)) {
      await req.client.setProfilePic(pathFile, contato);
    }
    await unlinkAsync(pathFile);

    return res
      .status(201)
      .json({ status: 'success', response: { message: 'Group profile photo successfully changed' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error changing group photo' });
  }
}

export async function getUnreadMessages(req, res) {
  try {
    const response = await req.client.getUnreadMessages(false, false, true);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(401).json({ status: 'error', response: 'Error on open list' });
  }
}

export async function getChatIsOnline(req, res) {
  const { phone } = req.params;
  try {
    const response = await req.client.getChatIsOnline(`${phone}@c.us`);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(401).json({ status: 'error', response: 'Error on get chat is online' });
  }
}

export async function getLastSeen(req, res) {
  const { phone } = req.params;
  try {
    const response = await req.client.getLastSeen(`${phone}@c.us`);

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(401).json({ status: 'error', response: 'Error on get chat last seen' });
  }
}

export async function getListMutes(req, res) {
  const { type = 'all' } = req.params;
  try {
    const response = await req.client.getListMutes(type);

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(401).json({ status: 'error', response: 'Error on get list mutes' });
  }
}

export async function loadAndGetAllMessagesInChat(req, res) {
  const { phone, includeMe = true, includeNotifications = false } = req.params;
  try {
    const response = await req.client.loadAndGetAllMessagesInChat(`${phone}@c.us`, includeMe, includeNotifications);

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(401).json({ status: 'error', response: 'Error on open list' });
  }
}
export async function loadEarlierMessages(req, res) {
  const { phone, includeMe = true, includeNotifications = false } = req.params;

  try {
    const response = await req.client.loadEarlierMessages(`${phone}`, includeMe, includeNotifications);

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(401).json({ status: 'error', response: 'Error on open list' });
  }
}
export async function sendMentioned(req, res) {
  const { phone, message, mentioned, isGroup = false } = req.body;

  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      response = await req.client.sendMentioned(`${contato}`, message, mentioned);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on send message mentioned' });
  }
}

export async function sendMute(req, res) {
  const { phone, time, type = 'hours', isGroup = false } = req.body;

  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      response = await req.client.sendMute(`${contato}`, time, type);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on send mute' });
  }
}

export async function sendSeen(req, res) {
  const { phone, isGroup = false } = req.body;

  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      response = await req.client.sendSeen(`${contato}`);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on send seen' });
  }
}

export async function setChatState(req, res) {
  const { phone, chatstate, isGroup = false } = req.body;

  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      response = await req.client.setChatState(`${contato}`, chatstate);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on send chat state' });
  }
}

export async function setTemporaryMessages(req, res) {
  const { phone, value = true, isGroup = false } = req.body;

  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      response = await req.client.setTemporaryMessages(`${contato}`, value);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on set temporary messages' });
  }
}

export async function setTyping(req, res) {
  const { phone, value = true, isGroup = false } = req.body;
  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      if (value) response = await req.client.startTyping(contato);
      else response = await req.client.stopTyping(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on set typing' });
  }
}

export async function checkNumberStatus(req, res) {
  const { phone } = req.params;
  try {
    let response;

    for (const contact of contactToArray(phone, false)) {
      response = await req.client.checkNumberStatus(`${contact}`);
    }

    return res.status(response.status).json(response);
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on check number status' });
  }
}

export async function getContact(req, res) {
  const { phone = true } = req.params;

  try {
    let response;

    for (const contact of contactToArray(phone, false)) {
      response = await req.client.getContact(`${contact}`);
    }

    returnSucess(res, req.session, phone, response);
  } catch (error) {
    req.logger.error(error);
    returnError(req, res, req.session, error, 'Error on get contact');
  }
}

export async function getAllContacts(req, res) {
  try {
    const response = await req.client.getAllContacts();
    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on get all constacts' });
  }
}

export async function getNumberProfile(req, res) {
  const { phone = true } = req.params;
  try {
    let response;

    for (const contato of contactToArray(phone, false)) {
      response = await req.client.getNumberProfile(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on get number profile' });
  }
}

export async function getProfilePicFromServer(req, res) {
  const { phone = true } = req.params;
  try {
    let response;
    for (const contato of contactToArray(phone, false)) {
      response = await req.client.getProfilePicFromServer(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on  get profile pic' });
  }
}

export async function getStatus(req, res) {
  const { phone = true } = req.params;
  try {
    let response;
    for (const contato of contactToArray(phone, false)) {
      response = await req.client.getStatus(contato);
    }
    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on  get status' });
  }
}

export async function setProfileStatus(req, res) {
  const { status } = req.body;
  try {
    let response = await req.client.setProfileStatus(status);

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on set profile status' });
  }
}

export async function starMessage(req, res) {
  const { messageId, star = true } = req.body;
  try {
    let response = await req.client.starMessage(messageId, star);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'error', message: 'Error on  start message' });
  }
}
