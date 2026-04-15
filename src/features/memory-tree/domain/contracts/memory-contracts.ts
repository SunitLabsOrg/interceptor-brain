import type { Entity } from "../../../shared/domain/contracts/common.js";

export type MemoryNodeId = string;

export interface MemoryNode<TPayload> extends Entity<MemoryNodeId> {
  readonly parentId: MemoryNodeId | null;
  readonly childrenIds: ReadonlyArray<MemoryNodeId>;
  readonly payload: TPayload;
  readonly lastAccessedUtc: Date;
}

export interface MemoryTree<TPayload> {
  readonly rootId: MemoryNodeId;
  getNode(nodeId: MemoryNodeId): MemoryNode<TPayload> | undefined;
  addNode(parentId: MemoryNodeId, payload: TPayload): MemoryNode<TPayload>;
  touch(nodeId: MemoryNodeId, atUtc: Date): void;
}

export interface SessionMemoryPayload {
  readonly sessionId: string;
  readonly summary: string;
  readonly tags: ReadonlyArray<string>;
  readonly promptFingerprint: string;
}

export interface SessionContextCache {
  save(sessionId: string, payload: SessionMemoryPayload): Promise<void>;
  get(sessionId: string): Promise<SessionMemoryPayload | undefined>;
  prune(maxNodes: number): Promise<number>;
}
