import type {
  DependencyLagUnit,
  DependencyType,
  NewDependencyPayload,
} from "@/features/project/types/dependency.type";

export const LAG_LIMIT = 1000;

export type DependencyDraft = {
  key: string;
  predecessorId: string;
  relationshipType: DependencyType;
  lag: string;
  lagUnit: DependencyLagUnit;
};

export type DependencyDraftError =
  | "predecessorRequired"
  | "lagInvalid"
  | "duplicate";

let draftSequence = 0;

export function newDependencyDraft(): DependencyDraft {
  draftSequence += 1;
  return {
    key: `dependency-draft-${draftSequence}`,
    predecessorId: "",
    relationshipType: "FS",
    lag: "0",
    lagUnit: "DAY",
  };
}

export function parseLag(value: string) {
  if (value.trim() === "") return null;
  const lag = Number(value);
  if (!Number.isFinite(lag) || Math.abs(lag) > LAG_LIMIT) return null;
  if (Math.abs(Math.round(lag * 100) - lag * 100) > 1e-6) return null;
  return lag;
}

export function buildDependencyPayloads(drafts: DependencyDraft[]): {
  payloads: NewDependencyPayload[];
  error: DependencyDraftError | null;
} {
  const payloads: NewDependencyPayload[] = [];
  const seen = new Set<string>();

  for (const draft of drafts) {
    if (!draft.predecessorId) {
      return { payloads: [], error: "predecessorRequired" };
    }
    if (seen.has(draft.predecessorId)) {
      return { payloads: [], error: "duplicate" };
    }
    seen.add(draft.predecessorId);

    const lag = parseLag(draft.lag);
    if (lag === null) return { payloads: [], error: "lagInvalid" };

    payloads.push({
      predecessorTaskId: Number(draft.predecessorId),
      relationshipType: draft.relationshipType,
      lag,
      lagUnit: draft.lagUnit,
    });
  }

  return { payloads, error: null };
}
