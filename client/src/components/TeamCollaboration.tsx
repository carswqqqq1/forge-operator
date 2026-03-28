import { useState } from "react";
import { Share2, Users, Lock, Eye, Edit, Trash2, Plus, Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: "owner" | "editor" | "viewer";
  joinedAt: Date;
}

interface TeamCollaborationProps {
  members?: TeamMember[];
  onInvite?: (email: string, role: string) => void;
  onRemove?: (memberId: string) => void;
  onChangeRole?: (memberId: string, role: string) => void;
}

export default function TeamCollaboration({
  members = [
    {
      id: "1",
      email: "carson@arroyo.marketing",
      name: "Carson Wesolowski",
      role: "owner",
      joinedAt: new Date("2025-01-01"),
    },
  ],
  onInvite = () => {},
  onRemove = () => {},
  onChangeRole = () => {},
}: TeamCollaborationProps) {
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [copied, setCopied] = useState(false);

  const shareLink = `https://forge-operator-arroyo.netlify.app/team/invite/abc123xyz`;

  const handleInvite = () => {
    if (inviteEmail) {
      onInvite(inviteEmail, inviteRole);
      setInviteEmail("");
      setInviteRole("editor");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Lock className="w-4 h-4" />;
      case "editor":
        return <Edit className="w-4 h-4" />;
      case "viewer":
        return <Eye className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-foreground hover:bg-primary/90">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share & Collaborate</span>
          <span className="sm:hidden">Share</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Collaboration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Link Section */}
          <Card className="p-4 border-2 border-dashed border-primary/20">
            <h3 className="font-serif font-bold text-sm mb-3">Share Link</h3>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="text-xs font-mono bg-muted"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Anyone with this link can join as a viewer
            </p>
          </Card>

          {/* Invite Section */}
          <Card className="p-4 border-2 border-dashed border-primary/20">
            <h3 className="font-serif font-bold text-sm mb-3">Invite Team Member</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="invite-email" className="text-xs font-medium mb-1 block">
                  Email Address
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="invite-role" className="text-xs font-medium mb-1 block">
                  Role
                </Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role" className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <span className="flex items-center gap-2">
                        <Eye className="w-3 h-3" />
                        Viewer (read-only)
                      </span>
                    </SelectItem>
                    <SelectItem value="editor">
                      <span className="flex items-center gap-2">
                        <Edit className="w-3 h-3" />
                        Editor (can edit)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleInvite}
                disabled={!inviteEmail}
                className="w-full gap-2 bg-primary text-foreground hover:bg-primary/90"
              >
                <Mail className="w-4 h-4" />
                Send Invite
              </Button>
            </div>
          </Card>

          {/* Team Members Section */}
          <Card className="p-4 border-2 border-dashed border-primary/20">
            <h3 className="font-serif font-bold text-sm mb-3">Team Members ({members.length})</h3>

            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {member.role === "owner" ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs font-medium text-primary">
                        <Lock className="w-3 h-3" />
                        Owner
                      </span>
                    ) : (
                      <Select
                        value={member.role}
                        onValueChange={(role) => onChangeRole(member.id, role)}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(member.id)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Permissions Guide */}
          <Card className="p-4 bg-accent/5 border border-accent/20">
            <h4 className="font-medium text-xs mb-2">Permission Levels</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <strong>Owner:</strong> Full access, can invite/remove members, manage billing
              </p>
              <p>
                <strong>Editor:</strong> Can create, edit, and delete tasks and projects
              </p>
              <p>
                <strong>Viewer:</strong> Read-only access, can view conversations and results
              </p>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
