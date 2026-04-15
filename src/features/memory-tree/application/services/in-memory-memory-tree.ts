import { randomUUID } from "node:crypto";
import type { MemoryNode, MemoryNodeId, MemoryTree } from "../../domain/contracts/memory-contracts.js";

export class InMemoryMemoryTree<TPayload> implements MemoryTree<TPayload> {
  public readonly rootId: MemoryNodeId;
  private readonly nodes: Map<MemoryNodeId, MemoryNode<TPayload>>;

  public constructor(rootId: MemoryNodeId, rootPayload: TPayload, nowUtc: Date) {
    this.rootId = rootId;
    this.nodes = new Map<MemoryNodeId, MemoryNode<TPayload>>([
      [rootId, {
        id: rootId,
        parentId: null,
        childrenIds: [],
        payload: rootPayload,
        lastAccessedUtc: nowUtc
      }]
    ]);
  }

  public getNode(nodeId: MemoryNodeId): MemoryNode<TPayload> | undefined {
    return this.nodes.get(nodeId);
  }

  public addNode(parentId: MemoryNodeId, payload: TPayload): MemoryNode<TPayload> {
    const parentNode = this.nodes.get(parentId);
    if (parentNode === undefined) {
      throw new Error(`Parent node not found: ${parentId}`);
    }

    const nodeId = randomUUID();
    const childNode: MemoryNode<TPayload> = {
      id: nodeId,
      parentId,
      childrenIds: [],
      payload,
      lastAccessedUtc: new Date()
    };

    this.nodes.set(nodeId, childNode);
    this.nodes.set(parentId, {
      ...parentNode,
      childrenIds: [...parentNode.childrenIds, nodeId]
    });

    return childNode;
  }

  public touch(nodeId: MemoryNodeId, atUtc: Date): void {
    const node = this.nodes.get(nodeId);
    if (node === undefined) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    this.nodes.set(nodeId, {
      ...node,
      lastAccessedUtc: atUtc
    });
  }

  public listNodes(): ReadonlyArray<MemoryNode<TPayload>> {
    return [...this.nodes.values()];
  }

  public removeLeaf(nodeId: MemoryNodeId): boolean {
    const node = this.nodes.get(nodeId);
    if (node === undefined || node.parentId === null || node.childrenIds.length > 0) {
      return false;
    }

    const parent = this.nodes.get(node.parentId);
    if (parent === undefined) {
      return false;
    }

    this.nodes.delete(nodeId);
    this.nodes.set(parent.id, {
      ...parent,
      childrenIds: parent.childrenIds.filter((id) => id !== nodeId)
    });

    return true;
  }
}
