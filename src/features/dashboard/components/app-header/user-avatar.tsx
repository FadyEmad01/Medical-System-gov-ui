"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMe } from "@/features/auth/hooks/use-me";
import { getInitials } from "@/lib/utils";

export default function UserAvatar() {
    const { data: user } = useMe();
    return (
        <>
            {
                user ? (
                    <Avatar className="h-8 w-8" >
                        {
                            user.avatar ? (
                                <AvatarImage src={user.avatar} alt={user.fullName} />
                            ) : null
                        }
                        < AvatarFallback className="" >
                            {getInitials(user.fullName)
                            }
                        </AvatarFallback >
                    </Avatar >
                ) : null
            }
        </>
    )
}
