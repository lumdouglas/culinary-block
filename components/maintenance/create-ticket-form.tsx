'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createTicket } from "@/app/actions/maintenance";
import { toast } from "sonner";
import { DialogClose } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { Camera } from "lucide-react";

export function CreateTicketForm({ kitchens }: { kitchens: Record<string, unknown>[] }) {
    const [loading, setLoading] = useState(false);
    // Note: We'd typically close the dialog on success, but for simplicity we rely on page refresh/revalidate or we can use a passed prop to close.
    // Since this is inside a Dialog in a server component, closing it programmatically without context/state lift is tricky.
    // For now, valid submission will just show toast. Rerendering will happen via server action revalidatePath.

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        // 1. Upload photo if present
        const photoFile = formData.get('photo') as File | null;
        let photoUrl = '';

        if (photoFile && photoFile.size > 0) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('request-photos')
                    .upload(fileName, photoFile);

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('request-photos')
                        .getPublicUrl(fileName);
                    photoUrl = urlData.publicUrl;
                }
            }
        }

        // Append the photo URL string to formData
        if (photoUrl) {
            formData.set('photo_url', photoUrl);
        }

        const res = await createTicket(null, formData);
        setLoading(false);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("Ticket created successfully");
            document.getElementById('close-dialog-btn')?.click();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                    Title
                </Label>
                <Input id="title" name="title" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="kitchen" className="text-right">
                    Kitchen
                </Label>
                <Select name="kitchen_id">
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="general">General Facility</SelectItem>
                        {kitchens.map((k: Record<string, unknown>) => (
                            <SelectItem key={String(k.id)} value={String(k.id)}>{String(k.name)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                    Priority
                </Label>
                <Select name="priority" defaultValue="medium">
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                    Details
                </Label>
                <Textarea id="description" name="description" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="photo" className="text-right flex items-center justify-end gap-2">
                    <Camera className="h-4 w-4" />
                    Photo
                </Label>
                <div className="col-span-3 space-y-1">
                    <Input
                        type="file"
                        id="photo"
                        name="photo"
                        accept="image/*"
                        className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">
                        Optional: attach an image of the issue
                    </p>
                </div>
            </div>
            <div className="flex justify-end mt-4 gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline" id="close-dialog-btn">
                        Cancel
                    </Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Ticket"}
                </Button>
            </div>
        </form>
    );
}
