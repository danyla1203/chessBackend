import { GameChatMessage, GameChatIncomingMessage } from '.';

export class GameChat {
  messages: { [k: number]: GameChatMessage[] };

  constructor(playerId: number) {
    this.messages = { [playerId]: [] };
  }
  addChatParticipant(playerId: number) {
    this.messages[playerId] = [];
  }

  public addMessage(
    playerId: number,
    message: GameChatIncomingMessage,
  ): null | GameChatMessage {
    if (!message.text) return null;
    if (!this.messages[playerId]) return null;

    const messageData = {
      text: message.text,
      date: new Date(),
    };
    this.messages[playerId].push(messageData);
    return messageData;
  }
  public getAllMessages(): GameChatMessage[] {
    const msgArr: GameChatMessage[] = [];
    for (const playerId in this.messages) {
      for (const message of this.messages[playerId]) msgArr.push(message);
    }
    return msgArr;
  }
}