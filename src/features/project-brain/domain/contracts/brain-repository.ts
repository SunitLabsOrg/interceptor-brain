import type { BrainStore } from "./brain-models.js";

export interface BrainRepository {
  load(): Promise<BrainStore>;
  save(store: BrainStore): Promise<void>;
}
