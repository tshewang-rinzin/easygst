import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getContractWithDetails } from '@/lib/contracts/queries';
import { completeContract, cancelContract, deleteContract, updateContract } from '@/lib/contracts/actions';

export const GET = withAuth(async (request: NextRequest, { params }) => {
  try {
    const contract = await getContractWithDetails(params.id);
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    const body = await request.json();
    const { action, ...fields } = body;

    let result;
    if (action === 'complete') {
      result = await completeContract(params.id, user.id);
    } else if (action === 'cancel') {
      result = await cancelContract(params.id, user.id);
    } else if (action === 'update' || !action) {
      // Field update — build FormData for the server action
      const formData = new FormData();
      formData.append('id', params.id);
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      }
      result = await updateContract({}, formData);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    const result = await deleteContract(params.id, user.id);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
});
