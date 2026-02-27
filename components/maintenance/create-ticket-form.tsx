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
import { Camera } from "lucide-react";

export function CreateTicketForm({ kitchens }: { kitchens: Record<string, unknown>[] }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        // Pass the full FormData directly — photo upload is handled in the server action
        const formData = new FormData(e.currentTarget);
        const res = await createTicket(null, formData);
        setLoading(false);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("Ticket submitted successfully!");
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
