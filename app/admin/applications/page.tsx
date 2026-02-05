import { createClient } from '@/utils/supabase/server';
import { approveApplication } from '@/app/actions/applications';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: apps } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Pending Applications</h1>
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps?.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell>{app.email}</TableCell>
                <TableCell>
                  <Badge variant={app.status === 'approved' ? 'success' : 'outline'}>
                    {app.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {app.status === 'pending' && (
                    <form action={async () => {
                      "use server"
                      // In a real app, you'd generate/provide a user_id here
                      await approveApplication(app.id, app.temp_user_id);
                    }}>
                      <Button size="sm">Approve</Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}