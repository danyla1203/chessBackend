import {
  ConnectedUser,
  WSController,
  UseValidation,
  MessagePattern
} from '../../ws';
import { GameList } from '../list/GameList';
import { InactiveGameError } from '../../errors/Game/InactiveGame';
import { GameNotFound } from '../../errors/Game/NotFound';
import { BadRequestError } from '../../errors/BadRequest';
import {
  CompletedMove,
  GameData,
  Player,
  Game,
  GameChatIncomingMessage,
  GameChatMessage,
} from '../game';
import {
  GameResponseTypes,
  GameConfig,
  MakeTurnBody,
  ConnectToGame ,
} from '.';

export class GameRouter implements WSController {
  GameList: GameList;
  sendMessage: (
    user: ConnectedUser,
    type: GameResponseTypes,
    payload: any,
  ) => void;

  constructor(GameList: GameList) {
    this.GameList = GameList;
  }

  init(
    sendMessage: (user: ConnectedUser, type: GameResponseTypes, payload: any) => void
  ) {
    this.sendMessage = sendMessage;
  }

  private sendGameMessage(
    user: ConnectedUser,
    type: GameResponseTypes,
    payload: any,
  ): void {
    this.sendMessage(user, type, { type, payload });
  }

  private sendTurnResultToUsers(
    game: Game,
    {
      shah, mate, strikedData 
    }: CompletedMove,
  ): void {
    for (const playerKey in game.players) {
      const actualState = game.actualState();
      const boards = {
        white: Object.fromEntries(actualState.white),
        black: Object.fromEntries(actualState.black),
      };
      const player: Player = game.players[playerKey];
      this.sendGameMessage(player, GameResponseTypes.UPDATE_STATE, { board: boards, });
      if (strikedData)
        this.sendGameMessage(player, GameResponseTypes.STRIKE, strikedData);
      if (shah) this.sendGameMessage(player, GameResponseTypes.SHAH, shah);
      if (mate) this.sendGameMessage(player, GameResponseTypes.MATE, mate);
    }
    //TODO: send move result to spectators
  }

  @UseValidation(GameConfig)
  @MessagePattern('/game/new-game')
  startNewGameHandler(user: ConnectedUser, gameConfig: GameConfig): void {
    const game = new Game(
      user,
      (users: ConnectedUser[], data: GameData) => {
        users.forEach((user: ConnectedUser) => {
          this.sendGameMessage(user, GameResponseTypes.PLAYER_TIMEOUT, data);
        });
      },
      gameConfig,
    );

    this.GameList.addGame(game);
    this.sendGameMessage(user, GameResponseTypes.GAME_CREATED, {});
  }

  @UseValidation(ConnectToGame)
  @MessagePattern('/game/сonnect/spectator')
  connectToGameAsSpectatorHandler(user: ConnectedUser, gameId: number): void {
    const game: Game | null = this.GameList.findGameInLobby(gameId);
    if (!game) throw new GameNotFound();

    game.addSpectator(user);

    this.sendGameMessage(
      user,
      GameResponseTypes.INIT_GAME,
      game.initedGameData(user.id),
    );
  }

  @UseValidation(ConnectToGame)
  @MessagePattern('/game/сonnect')
  connectToGameHandler(user: ConnectedUser, gameId: number): void {
    const game: Game | null = this.GameList.findGameInLobby(gameId);

    if (!game) throw new GameNotFound();
    game.addPlayer(user);
    game.start();

    this.GameList.removeGameFromLobby(game.id);
    this.GameList.removeCreatedGameByUser(user.id);

    Object.keys(game.players).map((playerId: string) => {
      const player = game.players[parseInt(playerId)];
      const initedGameData = game.initedGameData(parseInt(playerId));
      this.sendGameMessage(player, GameResponseTypes.INIT_GAME, initedGameData);
      this.sendGameMessage(player, GameResponseTypes.GAME_START, {});
    });
  }

  @UseValidation(MakeTurnBody)
  @MessagePattern('/game/make-turn')
  makeTurnHandler(user: ConnectedUser, moveData: MakeTurnBody): void {
    const game: Game | null = this.GameList.findStartedGame(moveData.gameId);
    if (!game) throw new GameNotFound();
    if (!game.isActive) throw new InactiveGameError();

    const result: CompletedMove = game.makeTurn(user.id, moveData.body);
    this.sendTurnResultToUsers(game, result);
    const player: Player = game.players[user.id];
    const updateTimers = { timeRemain: player.timeRemain, side: player.side };
    this.sendGameMessage(player, GameResponseTypes.UPDATE_TIMERS, updateTimers);
  }

  @UseValidation(GameChatIncomingMessage)
  @MessagePattern('/game/chat/message')
  chatMessageHandler(
    user: ConnectedUser,
    message: GameChatIncomingMessage,
  ): void {
    const game: Game | null = this.GameList.findStartedGame(message.gameId);
    if (!game) throw new GameNotFound();

    const result: GameChatMessage | null = game.chatMessage(user.id, message);
    if (result) {
      Object.keys(game.players).map((playerId: string) => {
        const player = game.players[parseInt(playerId)];
        this.sendGameMessage(player, GameResponseTypes.CHAT_MESSAGE, {
          message: result,
          author: { id: user.id, name: user.name },
        });
      });
    } else throw new BadRequestError('Incorrect message');
  }
}
