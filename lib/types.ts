export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  bankId: string;
  avatar: string;
  tagline: string;
  isDemoFocus?: boolean;
}

export interface MeetingMemoryRecord {
  date: string;
  summary: string;
  content: string;
  hasOutstandingCommitment?: boolean;
}

export interface RecalledItem {
  id: string;
  text: string;
  type?: string | null;
  occurredStart?: string | null;
}

export interface BriefResponse {
  contact: Contact;
  withoutMemory: {
    text: string;
    model: string;
    error?: string | null;
  };
  withHindsight: {
    rawMemories: RecalledItem[];
    reflectionText: string;
    synthesizedBrief: {
      urgentOverdue: string[];
      agendaRevisit: string[];
      strategicLead: string;
      summary: string;
    };
    modelUsed: string;
    error?: string | null;
  };
  diagnostics: {
    hindsightBankId: string;
    hindsightConnected: boolean;
    groqConnected: boolean;
    modelUsed: string;
    timestamp: string;
    errors?: string[];
  };
}

export interface RetainRequestPayload {
  contactId: string;
  outcomeText: string;
}
