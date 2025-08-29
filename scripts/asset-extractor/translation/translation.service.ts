import { TranslationRepository } from "./translation.repository.ts";
import type { TJournalData } from "../asset/component.dto.ts";

export class TranslationService {
  private readonly _translationRepo: TranslationRepository;

  constructor(translationRepo: TranslationRepository) {
    this._translationRepo = translationRepo;
  }

  getTranslatedJournalData(journalData: TJournalData): TJournalData {
    journalData.PrimaryDisplayName = this._translationRepo.getItemTranslation(journalData.PrimaryDisplayName ?? "");
    journalData.NotificationPanelDescription = this._translationRepo.getItemTranslation(
      journalData.NotificationPanelDescription ?? "",
    );
    journalData.AmmonomiconFullEntry = this._translationRepo.getItemTranslation(journalData.AmmonomiconFullEntry ?? "");
    return journalData;
  }
}
