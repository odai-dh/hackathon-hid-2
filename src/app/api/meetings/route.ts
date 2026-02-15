import { NextRequest, NextResponse } from 'next/server';
import { getMeetings, saveMeeting } from '@/lib/data';
import { Meeting } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = {
    opportunityId: searchParams.get('opportunityId') || undefined,
    accountId: searchParams.get('accountId') || undefined,
    product: searchParams.get('product') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
  };
  return NextResponse.json(getMeetings(filters));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const meeting: Meeting = {
    id: `ACT-NEW-${uuidv4().slice(0, 8)}`,
    opportunityId: body.opportunityId,
    accountId: body.accountId,
    date: body.date || new Date().toISOString().split('T')[0],
    title: body.title,
    type: body.type || body.title,
    participants: body.participants || [],
    participantContactIds: body.participantContactIds || [],
    transcriptRaw: body.transcriptRaw,
    outcome: body.outcome || '',
    tags: body.tags || [],
    insights: body.insights || null,
  };
  saveMeeting(meeting);
  return NextResponse.json(meeting, { status: 201 });
}
