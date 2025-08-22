import { AssetService } from "../asset/asset-service.ts";
import { PlayerRepository } from "./player.repository.ts";
import type { TPlayerName } from "../pickup-object/client/models/player.model.ts";

export class PlayerService {
  private readonly _playerRepository;

  constructor(playerRepository: PlayerRepository) {
    this._playerRepository = playerRepository;
  }

  static async create(assetService: AssetService) {
    const playerRepository = await PlayerRepository.create(assetService);
    return new PlayerService(playerRepository);
  }

  getOwners(
    pickupObjectId: number,
    prop: "startingGunIds" | "startingAlternateGunIds" | "startingActiveItemIds" | "startingPassiveItemIds",
  ): TPlayerName[] {
    const players = this._playerRepository.getPlayers();
    const res: TPlayerName[] = [];

    for (const player of players) {
      if (player.playerController[prop].includes(pickupObjectId)) {
        res.push(player.playerController.$$id as TPlayerName);
      }
    }
    return res;
  }
}
