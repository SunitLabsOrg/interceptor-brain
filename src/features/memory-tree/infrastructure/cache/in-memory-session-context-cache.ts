import type { SessionContextCache, SessionMemoryPayload } from "../../domain/contracts/memory-contracts.js";
import { InMemoryMemoryTree } from "../../application/services/in-memory-memory-tree.js";

export class InMemorySessionContextCache implements SessionContextCache {
  private readonly tree: InMemoryMemoryTree<SessionMemoryPayload>;
  private readonly sessionToNodeIndex = new Map<string, string>();

  public constructor() {
    this.tree = new InMemoryMemoryTree<SessionMemoryPayload>(
      "root",
      {
        sessionId: "root",
        summary: "root",
        tags: [],
        promptFingerprint: "root"
      },
      new Date()
    );
  }

  public async save(sessionId: string, payload: SessionMemoryPayload): Promise<void> {
    const node = this.tree.addNode(this.tree.rootId, payload);
    this.sessionToNodeIndex.set(sessionId, node.id);
  }

  public async get(sessionId: string): Promise<SessionMemoryPayload | undefined> {
    const nodeId = this.sessionToNodeIndex.get(sessionId);
    if (nodeId === undefined) {
      return undefined;
    }

    const node = this.tree.getNode(nodeId);
    if (node === undefined) {
      this.sessionToNodeIndex.delete(sessionId);
      return undefined;
    }

    this.tree.touch(node.id, new Date());
    return node.payload;
  }

  public async prune(maxNodes: number): Promise<number> {
    const nodes = this.tree.listNodes()
      .filter((node) => node.id !== this.tree.rootId);

    if (nodes.length <= maxNodes) {
      return 0;
    }

    const removable = [...nodes]
      .sort((left, right) =>
        left.lastAccessedUtc.getTime() - right.lastAccessedUtc.getTime());

    let removedCount = 0;
    const target = nodes.length - maxNodes;

    for (const node of removable) {
      if (removedCount >= target) {
        break;
      }

      if (this.tree.removeLeaf(node.id)) {
        removedCount += 1;

        for (const [sessionId, nodeId] of this.sessionToNodeIndex.entries()) {
          if (nodeId === node.id) {
            this.sessionToNodeIndex.delete(sessionId);
          }
        }
      }
    }

    return removedCount;
  }
}
