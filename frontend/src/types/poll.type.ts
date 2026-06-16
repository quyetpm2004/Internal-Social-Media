export interface PollOption {
  id: number;
  label: string;
  voteCount: number;
  voters: {
    id: number;
    fullName: string;
  }[];
}

export interface PollSummary {
  id: number;
  question: string;
  allowMultiple: boolean;
  endsAt: string | null;
  status: string;
  totalVotes: number;
  options: PollOption[];
  myVotes: number[];
}

export interface PollInput {
  question: string;
  options: string[];
  allowMultiple?: boolean;
}
