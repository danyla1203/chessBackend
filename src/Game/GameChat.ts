export type IncomingMessage = {
  text?: string
}

export type Message = {
  text: string
  date: Date
}
export type MessageData = {
  text: string
  date: Date
}

export class GameChat {
  messages: { [k: number]: Message[] };

  constructor(playerId: number) {
    this.messages = { [playerId]: [] };
  }
  addChatParticipant(playerId: number) {
    this.messages[playerId] = [];
  }
  
  public addMessage(playerId: number, message: IncomingMessage): null|MessageData {
    if (!message.text) return null;
    if (!this.messages[playerId]) return null;
    const messageData = { text: message.text, date: new Date() };
    this.messages[playerId].push(messageData);
    return messageData;
  }
  public getAllMessages(): MessageData[]  {
    const msgArr: MessageData[] = [];
    for (const playerId in this.messages) {
      for (const message of this.messages[playerId]) msgArr.push(message);
    }
    return msgArr;
  }
}