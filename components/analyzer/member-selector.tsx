"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/hooks/use-user"

interface Props {
  value?: string
  onChange: (memberId: string | undefined) => void
}

export function MemberSelector({ value, onChange }: Props) {
  const { user, profile } = useUser()
  const [members, setMembers] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    // TODO: Fetch household members from API
    // For now, just show the current user
    if (user && profile) {
      setMembers([
        {
          id: user.$id || "",
          name: profile.fullName || user.name || "Me",
        },
      ])
    }
  }, [user, profile])

  if (members.length <= 1) {
    return null // Don't show selector if only one member
  }

  return (
    <Select value={value || ""} onValueChange={(v) => onChange(v || undefined)}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select member" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All members</SelectItem>
        {members.map((member) => (
          <SelectItem key={member.id} value={member.id}>
            {member.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
