"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddMemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    fullName: string;
    age?: number;
    gender?: string;
    householdRole?: string;
  }) => void;
  isSubmitting: boolean;
}

export function AddMemberForm({ open, onOpenChange, onSubmit, isSubmitting }: AddMemberFormProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("dependent");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      fullName: name.trim(),
      age: age ? parseInt(age, 10) : undefined,
      gender: gender || undefined,
      householdRole: role || undefined,
    });
    setName("");
    setAge("");
    setGender("");
    setRole("dependent");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-name">Full Name *</Label>
            <Input
              id="member-name"
              placeholder="e.g., John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="member-age">Age</Label>
              <Input
                id="member-age"
                type="number"
                placeholder="e.g., 8"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={0}
                max={120}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="secondary_adult">Adult</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="dependent">Dependent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Member"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
