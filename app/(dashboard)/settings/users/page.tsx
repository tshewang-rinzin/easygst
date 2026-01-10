'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Shield, Trash2, X, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import useSWR from 'swr';
import { inviteUser, updateMemberRole, removeMember, cancelInvitation, resendInvitation } from '@/lib/users/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TeamMemberWithUser {
  id: number;
  userId: number;
  role: string;
  joinedAt: string;
  name: string | null;
  email: string;
}

interface PendingInvitation {
  id: number;
  email: string;
  role: string;
  invitedAt: string;
  invitedByName: string | null;
  invitedByEmail: string;
  emailSentCount: number;
  lastEmailSentAt: string | null;
  invitationTokenExpiry: string | null;
  status: string;
}

export default function UsersRolesPage() {
  const { data, mutate, isLoading } = useSWR<{
    members: TeamMemberWithUser[];
    invitations: PendingInvitation[];
  }>('/api/users/team-members', fetcher);

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'admin' | 'member'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail) return;

    setIsSubmitting(true);
    setMessage(null);

    const result = await inviteUser({ email: inviteEmail, role: inviteRole });

    if ('success' in result && result.success) {
      setMessage({ type: 'success', text: result.message || 'Invitation sent' });
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      mutate();
    } else {
      setMessage({ type: 'error', text: ('message' in result && result.message) || 'Failed to send invitation' });
    }

    setIsSubmitting(false);
  };

  const handleChangeRole = async (memberId: number, newRole: 'owner' | 'admin' | 'member') => {
    setMessage(null);
    const result = await updateMemberRole({ memberId, role: newRole });

    if ('success' in result && result.success) {
      setMessage({ type: 'success', text: result.message || 'Role updated' });
      mutate();
    } else {
      setMessage({ type: 'error', text: ('message' in result && result.message) || 'Failed to update role' });
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) return;

    setMessage(null);
    const result = await removeMember({ memberId });

    if ('success' in result && result.success) {
      setMessage({ type: 'success', text: result.message || 'Member removed' });
      mutate();
    } else {
      setMessage({ type: 'error', text: ('message' in result && result.message) || 'Failed to remove member' });
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    setMessage(null);
    const result = await cancelInvitation({ invitationId });

    if ('success' in result && result.success) {
      setMessage({ type: 'success', text: result.message || 'Invitation cancelled' });
      mutate();
    } else {
      setMessage({ type: 'error', text: ('message' in result && result.message) || 'Failed to cancel invitation' });
    }
  };

  const handleResendInvitation = async (invitationId: number) => {
    setResendingId(invitationId);
    setMessage(null);

    const result = await resendInvitation({ invitationId });

    if ('success' in result && result.success) {
      setMessage({ type: 'success', text: result.message || 'Invitation resent' });
      mutate();
    } else {
      setMessage({ type: 'error', text: ('message' in result && result.message) || 'Failed to resend invitation' });
    }

    setResendingId(null);
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || roleColors.member}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users & Roles</h1>
          <p className="text-muted-foreground">Manage team members and their permissions</p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {message && (
        <Card
          className={
            message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }
        >
          <CardContent className="pt-6">
            <p className={message.type === 'success' ? 'text-green-900' : 'text-red-900'}>
              {message.text}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({data?.members?.length || 0})
          </CardTitle>
          <CardDescription>Active members of your team with their roles</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : !data?.members || data.members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No team members found</div>
          ) : (
            <div className="space-y-4">
              {data.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{member.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleChangeRole(member.id, e.target.value as 'owner' | 'admin' | 'member')
                      }
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {data?.invitations && data.invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({data.invitations.length})
            </CardTitle>
            <CardDescription>Users who have been invited but haven't joined yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Mail className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Invited by {invitation.invitedByName || invitation.invitedByEmail}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>
                          Sent {new Date(invitation.invitedAt).toLocaleDateString()}
                        </span>
                        {invitation.emailSentCount > 1 && (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Resent {invitation.emailSentCount - 1} time{invitation.emailSentCount > 2 ? 's' : ''}
                          </span>
                        )}
                        {invitation.invitationTokenExpiry && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {new Date(invitation.invitationTokenExpiry).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(invitation.role)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvitation(invitation.id)}
                      disabled={resendingId === invitation.id}
                    >
                      {resendingId === invitation.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Descriptions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-blue-900">
          <div>
            <strong>Owner:</strong> Full access to all features including team management, billing,
            and settings
          </div>
          <div>
            <strong>Admin:</strong> Can manage business data, create invoices, bills, and reports.
            Cannot manage team members
          </div>
          <div>
            <strong>Member:</strong> Can view and create basic records. Limited access to financial
            data and reports
          </div>
          <div className="mt-4 pt-3 border-t border-blue-300">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            You cannot change your own role or remove yourself from the team
          </div>
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User to Team</DialogTitle>
            <DialogDescription>
              Send an invitation to a new team member. They will receive an email with instructions
              to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'owner' | 'admin' | 'member')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isSubmitting || !inviteEmail}>
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
