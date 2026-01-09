import { NextResponse } from 'next/server';
import { getTeamMembers, getPendingInvitations } from '@/lib/users/queries';

export async function GET() {
  try {
    const [members, invitations] = await Promise.all([
      getTeamMembers(),
      getPendingInvitations(),
    ]);

    return NextResponse.json({ members, invitations });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
