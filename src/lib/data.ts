import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Account, Contact, Opportunity, Meeting } from './types';

const dataDir = path.join(process.cwd(), 'src', 'data');

export function getAccounts(): Account[] {
  const raw = readFileSync(path.join(dataDir, 'accounts.json'), 'utf-8');
  return JSON.parse(raw);
}

export function getAccount(id: string): Account | undefined {
  return getAccounts().find(a => a.id === id);
}

export function getContacts(accountId?: string): Contact[] {
  const raw = readFileSync(path.join(dataDir, 'contacts.json'), 'utf-8');
  const contacts: Contact[] = JSON.parse(raw);
  if (accountId) return contacts.filter(c => c.account_id === accountId);
  return contacts;
}

export function getContact(id: string): Contact | undefined {
  return getContacts().find(c => c.id === id);
}

export function getOpportunities(accountId?: string): Opportunity[] {
  const raw = readFileSync(path.join(dataDir, 'opportunities.json'), 'utf-8');
  const opps: Opportunity[] = JSON.parse(raw);
  if (accountId) return opps.filter(o => o.accountId === accountId);
  return opps;
}

export function getOpportunity(id: string): Opportunity | undefined {
  return getOpportunities().find(o => o.id === id);
}

export function getMeetings(filters?: {
  opportunityId?: string;
  accountId?: string;
  product?: string;
  dateFrom?: string;
  dateTo?: string;
}): Meeting[] {
  const raw = readFileSync(path.join(dataDir, 'meetings.json'), 'utf-8');
  let meetings: Meeting[] = JSON.parse(raw);

  if (filters?.opportunityId) {
    meetings = meetings.filter(m => m.opportunityId === filters.opportunityId);
  }
  if (filters?.accountId) {
    meetings = meetings.filter(m => m.accountId === filters.accountId);
  }
  if (filters?.product) {
    const opps = getOpportunities();
    const oppIds = opps.filter(o => o.product === filters.product).map(o => o.id);
    meetings = meetings.filter(m => oppIds.includes(m.opportunityId));
  }
  if (filters?.dateFrom) {
    meetings = meetings.filter(m => m.date >= filters.dateFrom!);
  }
  if (filters?.dateTo) {
    meetings = meetings.filter(m => m.date <= filters.dateTo!);
  }

  return meetings.sort((a, b) => b.date.localeCompare(a.date));
}

export function getMeeting(id: string): Meeting | undefined {
  const raw = readFileSync(path.join(dataDir, 'meetings.json'), 'utf-8');
  const meetings: Meeting[] = JSON.parse(raw);
  return meetings.find(m => m.id === id);
}

export function saveMeeting(meeting: Meeting): void {
  const raw = readFileSync(path.join(dataDir, 'meetings.json'), 'utf-8');
  const meetings: Meeting[] = JSON.parse(raw);
  const idx = meetings.findIndex(m => m.id === meeting.id);
  if (idx >= 0) {
    meetings[idx] = meeting;
  } else {
    meetings.push(meeting);
  }
  writeFileSync(path.join(dataDir, 'meetings.json'), JSON.stringify(meetings, null, 2));
}
