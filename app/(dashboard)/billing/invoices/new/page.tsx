'use client';

import { createInvoice } from "@/app/actions/invoicing";
// Remove useFormState import as it is deprecated in favor of useActionState in React 19, 
// or stick to standard form submission for simplicity if experimental hooks are an issue.
// However, since we are using Next.js 15/16, let's use standard client component with transitions or simple submit.
import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewInvoicePage() {
    const router = useRouter();
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [tenantId, setTenantId] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [lineItems, setLineItems] = useState([
        { description: "", quantity: 1, unit_price: 0 },
    ]);

    useEffect(() => {
        const fetchTenants = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("profiles")
                .select("id, company_name")
                .eq("role", "tenant"); // Assuming we only invoice tenants

            if (data) setTenants(data);
        };
        fetchTenants();
    }, []);

    const addLineItem = () => {
        setLineItems([...lineItems, { description: "", quantity: 1, unit_price: 0 }]);
    };

    const removeLineItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    const updateLineItem = (index: number, field: string, value: any) => {
        const newLines = [...lineItems];
        // @ts-ignore
        newLines[index][field] = value;
        setLineItems(newLines);
    };

    const calculateTotal = () => {
        return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("tenant_id", tenantId);
        formData.append("due_date", dueDate);
        formData.append("notes", notes);
        formData.append("line_items", JSON.stringify(lineItems));

        // Call server action
        // Note: in a real app we'd use useActionState or similar, but direct calling is fine for this demo
        const result = await createInvoice(null, formData);

        setLoading(false);

        if (result?.error) {
            toast.error(result.error);
        } else {
            // redirect handled in server action, but if we are here, maybe something happened or we want to double check
            // actually server action redirect throws, so we might not reach here if successful.
            // handling non-redirect errors:
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create New Invoice</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tenant</Label>
                                <Select value={tenantId} onValueChange={setTenantId} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select tenant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tenants.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                placeholder="Payment instructions, etc."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Line Items</CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {lineItems.map((item, index) => (
                            <div key={index} className="flex gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        value={item.description}
                                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="w-24 space-y-2">
                                    <Label>Qty</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="w-32 space-y-2">
                                    <Label>Price</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => updateLineItem(index, "unit_price", parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="pb-2 font-bold w-24 text-right">
                                    ${(item.quantity * item.unit_price).toFixed(2)}
                                </div>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeLineItem(index)}
                                    disabled={lineItems.length === 1}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        <div className="pt-4 border-t flex justify-end">
                            <div className="text-xl font-bold">
                                Total: ${calculateTotal().toFixed(2)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Invoice"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
