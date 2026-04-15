export type LanguageKind = "python" | "dotnet";

export interface TimeProvider {
  now(): Date;
}

export interface Entity<TId> {
  readonly id: TId;
}
