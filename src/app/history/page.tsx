"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../../components/ui/sidebar';
import { LineChart, History, Settings, Upload, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../hooks/use-toast';
import { HOURLY_USAGE_DATA } from '../../lib/data';
import { downloadCSV } from '../../lib/csv';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '../../components/ui/table';

export default function HistoryPage() {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      // Here you would typically process the file
      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Please select a file to upload.",
      });
    }
  };

  const handleDownload = () => {
    downloadCSV(HOURLY_USAGE_DATA, 'hourly_energy_data.csv');
    toast({
      title: "Download Started",
      description: "Downloading hourly_energy_data.csv.",
    });
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/home">
                <LineChart />
                Prediction
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive>
              <Link href="/history">
                <History />
                History
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
               <Link href="/settings">
                <Settings />
                Setting
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Management</CardTitle>
              <CardDescription>Upload or download your energy consumption data in CSV format.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Upload Dataset</h3>
                <div className="flex items-center space-x-2">
                  <Input type="file" accept=".csv" onChange={handleFileChange} />
                  <Button onClick={handleUpload}>
                    <Upload className="mr-2" /> Upload
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Download Dataset</h3>
                <p className="text-sm text-muted-foreground">Download the hourly energy consumption data.</p>
                <Button onClick={handleDownload} variant="secondary">
                  <Download className="mr-2" /> Download CSV
                </Button>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Historical Data</CardTitle>
              <CardDescription>A view of the hourly energy data for the last 24 hours.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>A list of your recent energy records.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Time</TableHead>
                    <TableHead className="text-right">Consumption (kWh)</TableHead>
                    <TableHead className="text-right">Generation (kWh)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HOURLY_USAGE_DATA.map((data) => (
                    <TableRow key={data.time}>
                      <TableCell className="font-medium">{data.time}</TableCell>
                      <TableCell className="text-right">{data.consumption}</TableCell>
                      <TableCell className="text-right">{data.generation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
