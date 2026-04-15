import path from "node:path";
import { ProjectBrainService } from "../services/project-brain-service.js";
import { JsonFileBrainRepository } from "../../infrastructure/repositories/json-file-brain-repository.js";

const DEFAULT_STORE_RELATIVE_PATH = ".interceptor-brain/store.json";

export function createProjectBrainService(storePath?: string): ProjectBrainService {
  const resolvedPath = storePath
    ?? process.env.INTERCEPTOR_BRAIN_STORE
    ?? path.resolve(process.cwd(), DEFAULT_STORE_RELATIVE_PATH);

  return new ProjectBrainService(new JsonFileBrainRepository(resolvedPath));
}
