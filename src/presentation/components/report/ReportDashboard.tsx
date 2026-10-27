'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReservations } from '../../context/ReservationContext';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useToast } from '../../context/ToastContext';
import { cn } from '@/lib/utils';

export const ReportDashboard: React.FC = () => {
  const { reservations, rooms } = useReservations();
  const { toast } = useToast();

  const [selectedRoomFilter, setSelectedRoomFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRoomFilter, selectedStatusFilter]);

  const filteredData = reservations.filter((r) => {
    if (selectedRoomFilter !== 'all' && r.roomId !== selectedRoomFilter) return false;
    if (selectedStatusFilter !== 'all' && r.status !== selectedStatusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handleExportExcel = () => {
    const excelData = filteredData.map((item, idx) => ({
      No: idx + 1,
      'Nama Kegiatan': item.eventName,
      'Hari & Tanggal': item.eventDate,
      'Waktu Pelaksanaan': `${item.startTime} - ${item.endTime} WIB`,
      Ruangan: item.roomName,
      'Pejabat Pelaksana': item.executorOfficial || '-',
      'Pejabat Pendamping': item.accompanyingOfficial || '-',
      Pakaian: item.dressCode || '-',
      'Asal Surat': item.letterOrigin,
      'Label Kategori': item.categoryName || '-',
      Status: item.status.toUpperCase(),
      'Diverifikasi Oleh': item.verifiedByName || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi Reservasi');
    XLSX.writeFile(workbook, `Rekap_Reservasi_Walikota_Jaktim_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({
      title: 'Ekspor Excel Berhasil',
      description: 'File rekapitulasi data reservasi Excel telah diunduh.',
      variant: 'success',
    });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PEMERINTAH KOTA ADMINISTRASI JAKARTA TIMUR', 148, 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('REKAPITULASI PENGGUNAAN RUANG RAPAT DAN FASILITAS KANTOR', 148, 20, { align: 'center' });
    doc.text(`Dicetak: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: localeId })} WIB`, 148, 25, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.line(14, 28, 282, 28);

    const tableRows = filteredData.map((item, idx) => [
      idx + 1,
      item.eventName,
      item.eventDate,
      `${item.startTime}-${item.endTime}`,
      item.roomName,
      item.executorOfficial || '-',
      item.letterOrigin,
      item.categoryName || '-',
      item.status.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['No', 'Nama Acara', 'Tanggal', 'Jam', 'Ruangan', 'Pejabat', 'Asal Surat', 'Kategori', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [24, 24, 27], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 2 },
    });

    doc.save(`Laporan_Reservasi_Walikota_Jaktim_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({
      title: 'Ekspor PDF Berhasil',
      description: 'Dokumen resmi rekapitulasi PDF siap dicetak atau diarsipkan.',
      variant: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Laporan & Rekapitulasi
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ekspor rekap penggunaan ruang untuk keperluan SPJ, evaluasi, dan arsip.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            Excel (.xlsx)
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            PDF Resmi
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Filter:</span>
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-hidden"
          >
            <option value="all">Semua Ruangan</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="disetujui">Hanya Disetujui</option>
            <option value="menunggu">Hanya Menunggu</option>
            <option value="ditolak">Hanya Ditolak</option>
          </select>
        </div>

        <span className="text-xs text-muted-foreground">
          Total <b>{filteredData.length}</b> agenda
        </span>
      </div>

      {/* Table Report with dedicated minimum width & clean responsive scroll */}
      <Card className="overflow-hidden border border-border shadow-xs">
        <div className="overflow-x-auto">
          <Table className="min-w-[1180px]">
            <TableHeader>
              <TableRow className="bg-muted/40 border-b border-border">
                <TableHead className="w-12 text-center font-bold">No</TableHead>
                <TableHead className="w-[360px] min-w-[320px] font-bold">Nama Acara</TableHead>
                <TableHead className="w-[180px] min-w-[160px] font-bold">Tanggal & Jam</TableHead>
                <TableHead className="w-[220px] min-w-[200px] font-bold">Ruangan</TableHead>
                <TableHead className="w-[160px] min-w-[140px] font-bold">Pelaksana</TableHead>
                <TableHead className="w-[220px] min-w-[190px] font-bold">Asal Surat</TableHead>
                <TableHead className="w-[180px] min-w-[150px] font-bold">Kategori</TableHead>
                <TableHead className="w-[120px] text-center font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                    Tidak ada agenda kegiatan yang sesuai dengan filter yang dipilih.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-muted-foreground text-center font-semibold text-xs">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[300px] font-semibold text-foreground leading-normal">
                        {item.eventName}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium text-foreground">
                        {format(parseISO(item.eventDate), 'dd MMM yyyy', { locale: localeId })}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {item.startTime} - {item.endTime} WIB
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[180px] font-semibold text-foreground leading-normal">
                        {item.roomName}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="min-w-[130px] leading-normal">
                        {item.executorOfficial || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="min-w-[180px] leading-normal text-xs">
                        {item.letterOrigin}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.categoryName ? (
                        <Badge variant="neutral" className="text-[10px] whitespace-normal leading-tight max-w-[180px] text-left">
                          {item.categoryName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <Badge
                        variant={
                          item.status === 'disetujui'
                            ? 'success'
                            : item.status === 'menunggu'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-[10px] uppercase font-mono px-2 py-0.5"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Toolbar */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-border text-xs text-muted-foreground bg-card">
            <div>
              Menampilkan{' '}
              <span className="font-semibold text-foreground">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              -{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}
              </span>{' '}
              dari{' '}
              <span className="font-semibold text-foreground">{filteredData.length}</span>{' '}
              total agenda
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2.5 text-xs"
                >
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      return (
                        <React.Fragment key={p}>
                          {prev && p - prev > 1 && (
                            <span className="px-1 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(p)}
                            className={cn(
                              'h-7 w-7 p-0 text-xs font-medium',
                              currentPage === p && 'pointer-events-none'
                            )}
                          >
                            {p}
                          </Button>
                        </React.Fragment>
                      );
                    })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2.5 text-xs"
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
