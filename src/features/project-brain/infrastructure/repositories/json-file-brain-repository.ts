import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BrainRepository } from "../../domain/contracts/brain-repository.js";
import type { BrainStore } from "../../domain/contracts/brain-models.js";

const EMPTY_STORE: BrainStore = {
  tasks: [],
  sessions: [],
  decisions: [],
  rules: [],
  engineerPreferences: {}
};

export class JsonFileBrainRepository implements BrainRepository {
  private readonly storePath: string;

  public constructor(storePath: string) {
    this.storePath = storePath;
  }

  public async load(): Promise<BrainStore> {
    try {
      const content = await readFile(this.storePath, "utf8");
      const parsed = JSON.parse(content) as BrainStore;
      return {
        tasks: parsed.tasks ?? [],
        sessions: parsed.sessions ?? [],
        decisions: parsed.decisions ?? [],
        rules: parsed.rules ?? [],
        engineerPreferences: parsed.engineerPreferences ?? {}
      };
    } catch {
      return EMPTY_STORE;
    }
  }

  public async save(store: BrainStore): Promise<void> {
    await mkdir(path.dirname(this.storePath), { recursive: true });
    await writeFile(this.storePath, JSON.stringify(store, null, 2), "utf8");
  }
}
