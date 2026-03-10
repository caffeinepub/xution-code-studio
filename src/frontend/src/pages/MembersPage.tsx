import { UserRole } from "@/backend";
import QRCodeModal from "@/components/QRCodeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useAddMember,
  useRemoveMember,
  useUpdateUserRole,
} from "@/hooks/useQueries";
import { Principal } from "@icp-sdk/core/principal";
import {
  Loader2,
  QrCode,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MembersPage() {
  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const updateRole = useUpdateUserRole();

  const [addPrincipal, setAddPrincipal] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [removePrincipal, setRemovePrincipal] = useState("");
  const [rolePrincipal, setRolePrincipal] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.user);

  // QR modal state
  const [qrPrincipal, setQrPrincipal] = useState("");
  const [qrUsername, setQrUsername] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

  const parsePrincipal = (text: string): Principal | null => {
    try {
      return Principal.fromText(text.trim());
    } catch {
      return null;
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parsePrincipal(addPrincipal);
    if (!p) return toast.error("Invalid Principal ID");
    if (!addUsername.trim()) return toast.error("Username required");
    try {
      await addMember.mutateAsync({ userId: p, username: addUsername.trim() });
      toast.success(`Member "${addUsername}" added!`);
      setAddPrincipal("");
      setAddUsername("");
    } catch {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parsePrincipal(removePrincipal);
    if (!p) return toast.error("Invalid Principal ID");
    try {
      await removeMember.mutateAsync(p);
      toast.success("Member removed");
      setRemovePrincipal("");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parsePrincipal(rolePrincipal);
    if (!p) return toast.error("Invalid Principal ID");
    try {
      await updateRole.mutateAsync({ userId: p, role: selectedRole });
      toast.success("Role updated!");
      setRolePrincipal("");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleGenerateQR = () => {
    if (!qrPrincipal.trim() || !qrUsername.trim()) {
      toast.error("Enter both Principal ID and Username");
      return;
    }
    setShowQrModal(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Member Management</h1>
          <Badge className="bg-primary/20 text-primary border-primary/40">
            Class 6
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Add, remove, and manage member roles. Use the user's Principal ID to
          identify them.
        </p>
      </div>

      <div className="space-y-6" data-ocid="members.list">
        {/* Add Member */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Add Member</h2>
          </div>
          <form onSubmit={handleAddMember} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Principal ID</Label>
                <Input
                  value={addPrincipal}
                  onChange={(e) => setAddPrincipal(e.target.value)}
                  placeholder="aaaaa-aa..."
                  className="text-xs font-mono"
                  data-ocid="members.add_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Username</Label>
                <Input
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="username"
                  className="text-xs"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={addMember.isPending || !addPrincipal || !addUsername}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="members.add_button"
            >
              {addMember.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" /> Add Member
                </>
              )}
            </Button>
          </form>
        </div>

        <Separator className="bg-border/50" />

        {/* Generate QR Code */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Generate QR Code</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Generate and export a QR code for a member's profile. They can use
            it to log in.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Principal ID</Label>
              <Input
                value={qrPrincipal}
                onChange={(e) => setQrPrincipal(e.target.value)}
                placeholder="aaaaa-aa..."
                className="text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Username</Label>
              <Input
                value={qrUsername}
                onChange={(e) => setQrUsername(e.target.value)}
                placeholder="username"
                className="text-xs"
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleGenerateQR}
            disabled={!qrPrincipal.trim() || !qrUsername.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            data-ocid="members.qr_generate_button"
          >
            <QrCode className="w-4 h-4" />
            Generate & Export QR
          </Button>
        </div>

        <Separator className="bg-border/50" />

        {/* Update Role */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Update Role</h2>
          </div>
          <form onSubmit={handleUpdateRole} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Principal ID</Label>
                <Input
                  value={rolePrincipal}
                  onChange={(e) => setRolePrincipal(e.target.value)}
                  placeholder="aaaaa-aa..."
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as UserRole)}
                >
                  <SelectTrigger data-ocid="members.role_select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.user}>Member</SelectItem>
                    <SelectItem value={UserRole.admin}>
                      Class 6 Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              disabled={updateRole.isPending || !rolePrincipal}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-ocid="members.save_button"
            >
              {updateRole.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Update Role
                </>
              )}
            </Button>
          </form>
        </div>

        <Separator className="bg-border/50" />

        {/* Remove Member */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserMinus className="w-5 h-5 text-destructive" />
            <h2 className="font-semibold text-foreground">Remove Member</h2>
          </div>
          <form onSubmit={handleRemoveMember} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Principal ID</Label>
              <Input
                value={removePrincipal}
                onChange={(e) => setRemovePrincipal(e.target.value)}
                placeholder="aaaaa-aa..."
                className="text-xs font-mono"
              />
            </div>
            <Button
              type="submit"
              disabled={removeMember.isPending || !removePrincipal}
              variant="destructive"
              data-ocid="members.delete_button"
            >
              {removeMember.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removing...
                </>
              ) : (
                <>
                  <UserMinus className="w-4 h-4 mr-2" /> Remove Member
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        principalText={qrPrincipal}
        username={qrUsername}
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </div>
  );
}
