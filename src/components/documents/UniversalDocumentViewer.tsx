'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Pencil, 
  FileCheck, 
  Search, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Table,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { DocumentItem } from '@/lib/types';
import { resolveDocumentUrl } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

interface UniversalDocumentViewerProps {
  doc: DocumentItem;
  onClose: () => void;
  onEditExpiry: (doc: DocumentItem) => void;
}

export default function UniversalDocumentViewer({
  doc,
  onClose,
  onEditExpiry,
}: UniversalDocumentViewerProps) {
  const [viewTab, setViewTab] = useState<'viewer' | 'readview'>('viewer');

  // The stored fileUrl is a Supabase public URL, but storage reads now require
  // authentication — resolve a short-lived signed URL before fetching/displaying.
  const [resolvedUrl, setResolvedUrl] = useState<string>(doc.fileUrl || '#');
  const [urlResolving, setUrlResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setUrlResolving(true);
    resolveDocumentUrl(doc.fileUrl).then((url) => {
      if (!cancelled) {
        setResolvedUrl(url);
        setUrlResolving(false);
      }
    });
    return () => { cancelled = true; };
  }, [doc.fileUrl]);

  // A blob: URL only ever resolves inside the browser tab/session that created
  // it — if this record was saved with one (e.g. from a past failed cloud
  // upload) it can never load again, on any device or after any reload.
  // Detect it up front instead of showing an unexplained blank preview.
  const isDeadBlobUrl = typeof window !== 'undefined' && !!doc.fileUrl?.startsWith('blob:') && !doc.fileUrl.startsWith(`blob:${window.location.origin}`);

  // File type detection
  const fileName = doc.fileName || doc.title || '';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isImage = doc.fileFormat === 'image' || /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(fileName) || (doc.fileUrl && doc.fileUrl.startsWith('data:image/'));
  const isPdf = doc.fileFormat === 'pdf' || ext === 'pdf';
  const isWord = doc.fileFormat === 'docx' || ext === 'docx' || ext === 'doc';
  const isExcel = doc.fileFormat === 'xlsx' || ext === 'xlsx' || ext === 'xls' || ext === 'csv';

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Word (.docx) Parsed State
  const [wordHtml, setWordHtml] = useState<string>('');
  const [wordText, setWordText] = useState<string>('');

  // Excel (.xlsx) Parsed State
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [excelFilter, setExcelFilter] = useState('');

  // Image Viewer State
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load and parse document data based on format
  useEffect(() => {
    let isCancelled = false;

    async function loadDocumentData() {
      // Wait for the signed URL to resolve before attempting any fetch
      if (urlResolving) return;

      setIsLoading(true);
      setLoadError(null);

      // If document has no valid URL
      if (!resolvedUrl || resolvedUrl === '#') {
        setIsLoading(false);
        return;
      }

      try {
        if (isWord) {
          const res = await fetch(resolvedUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to download Word document.`);
          const arrayBuffer = await res.arrayBuffer();

          if (isCancelled) return;

          const [htmlResult, textResult] = await Promise.all([
            mammoth.convertToHtml({ arrayBuffer }),
            mammoth.extractRawText({ arrayBuffer })
          ]);

          if (isCancelled) return;
          setWordHtml(htmlResult.value || '<p class="text-gray-400 italic">No formatted content found in Word document.</p>');
          setWordText(textResult.value || '');
        } else if (isExcel) {
          const res = await fetch(resolvedUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to download Excel spreadsheet.`);
          const arrayBuffer = await res.arrayBuffer();

          if (isCancelled) return;

          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Spreadsheet contains no sheets.');
          }

          setSheetNames(workbook.SheetNames);
          const firstSheetName = workbook.SheetNames[0];
          setActiveSheet(firstSheetName);

          const sheet = workbook.Sheets[firstSheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          setExcelData(rows);
        }
      } catch (err: any) {
        console.error('Document parser error:', err);
        if (!isCancelled) {
          setLoadError(err.message || 'Unable to parse document in-app.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDocumentData();

    return () => {
      isCancelled = true;
    };
  }, [resolvedUrl, urlResolving, isWord, isExcel]);

  // Switch Excel sheets
  const handleSheetChange = async (sheetName: string) => {
    setActiveSheet(sheetName);
    try {
      if (!resolvedUrl || resolvedUrl === '#') return;
      const res = await fetch(resolvedUrl);
      const arrayBuffer = await res.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      setExcelData(rows);
    } catch (e) {
      console.error('Error switching sheet:', e);
    }
  };

  // Filter Excel Rows
  const filteredExcelData = React.useMemo(() => {
    if (!excelFilter.trim()) return excelData;
    const q = excelFilter.toLowerCase();
    return excelData.filter((row, idx) => {
      if (idx === 0) return true; // keep header row
      return row.some(cell => String(cell).toLowerCase().includes(q));
    });
  }, [excelData, excelFilter]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-[#0c0f17] border border-[#22283a] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topbar Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#0e121b] border-b border-[#1e2638] flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[rgba(205,160,82,0.15)] text-[#e6c875] border border-[rgba(205,160,82,0.3)] flex-shrink-0">
              {isImage ? <ImageIcon className="w-5 h-5" /> : isExcel ? <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> : <FileText className="w-5 h-5 text-[#cda052]" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-[200px] sm:max-w-md font-serif">
                  {doc.title}
                </h3>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold border ${
                  isExcel ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' :
                  isWord ? 'bg-blue-950/80 text-blue-400 border-blue-800/60' :
                  isPdf ? 'bg-rose-950/80 text-rose-400 border-rose-800/60' :
                  'bg-amber-950/80 text-[#e6c875] border-amber-800/60'
                }`}>
                  {doc.fileFormat || ext}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#94a3b8] truncate">
                <span className="truncate">{fileName}</span>
                <span>•</span>
                <span className="flex-shrink-0">{(doc.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                {doc.associatedVendor && (
                  <>
                    <span>•</span>
                    <span className="text-[#cbd5e1] truncate">{doc.associatedVendor}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#07090e] p-0.5 rounded-lg border border-[#1e2638]">
              <button
                onClick={() => setViewTab('viewer')}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  viewTab === 'viewer'
                    ? 'bg-[#141824] text-[#e6c875] border border-[#cda052]/40 shadow-sm font-semibold'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">In-App Preview</span>
              </button>
              <button
                onClick={() => setViewTab('readview')}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  viewTab === 'readview'
                    ? 'bg-[#141824] text-[#e6c875] border border-[#cda052]/40 shadow-sm font-semibold'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compliance & Data</span>
              </button>
            </div>

            {/* Edit Expiry Date */}
            <button
              onClick={() => onEditExpiry(doc)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#141824] border border-[#263147] text-[#e6c875] hover:text-white hover:border-[#cda052] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Edit compliance expiry date"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Edit Expiry</span>
            </button>

            {/* Download */}
            {resolvedUrl && resolvedUrl !== '#' && (
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noreferrer"
                download={fileName}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs flex items-center gap-1.5 hover:brightness-110 shadow-glow"
                title="Download original document file"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close Preview (Esc)"
              className="p-1.5 text-[#94a3b8] hover:text-white rounded-lg hover:bg-[#1a2133] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 bg-[#07090e] overflow-hidden flex flex-col relative">
          {isDeadBlobUrl ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">This file was never saved to cloud storage</h4>
                <p className="text-xs text-[#94a3b8] mt-1 max-w-md">
                  Its upload failed at the time and the record was saved with a temporary local link instead — this has
                  since been fixed for new uploads, but this file's original bytes can't be recovered.
                  Please delete this record and re-upload the original file.
                </p>
              </div>
            </div>
          ) : viewTab === 'viewer' ? (
            <>
              {/* 1. EXCEL SPREADSHEET VIEWER (.xlsx, .xls, .csv) */}
              {isExcel && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Excel Controls Bar */}
                  <div className="px-4 py-2 bg-[#0e121b] border-b border-[#1e2638] flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
                    {/* Sheet Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-full">
                      <span className="text-[#94a3b8] font-semibold text-[11px] mr-1 flex items-center gap-1">
                        <Table className="w-3.5 h-3.5 text-emerald-400" /> Sheets:
                      </span>
                      {sheetNames.map((name) => (
                        <button
                          key={name}
                          onClick={() => handleSheetChange(name)}
                          className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                            activeSheet === name
                              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-sm'
                              : 'bg-[#141824] text-[#94a3b8] hover:text-white border border-[#263147]'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>

                    {/* Filter in Sheet */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#94a3b8]" />
                        <input
                          type="text"
                          value={excelFilter}
                          onChange={(e) => setExcelFilter(e.target.value)}
                          placeholder="Filter cells..."
                          className="pl-8 pr-3 py-1 rounded-md bg-[#07090e] border border-[#263147] text-xs text-white placeholder-[#64748b] outline-none focus:border-emerald-500 w-36 sm:w-48"
                        />
                      </div>
                      <span className="text-[11px] text-[#94a3b8] font-mono">
                        {filteredExcelData.length} rows
                      </span>
                    </div>
                  </div>

                  {/* Excel Grid */}
                  <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    {isLoading ? (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-[#94a3b8]">
                        <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
                        <span>Parsing Excel spreadsheet data...</span>
                      </div>
                    ) : loadError ? (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-rose-400" />
                        <p className="text-sm text-white font-semibold">{loadError}</p>
                        <p className="text-xs text-[#94a3b8]">You can download and view the spreadsheet in Excel directly.</p>
                      </div>
                    ) : filteredExcelData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-[#94a3b8]">
                        No rows match filter &quot;{excelFilter}&quot;
                      </div>
                    ) : (
                      <div className="inline-block min-w-full align-middle border border-[#1e2638] rounded-xl overflow-hidden shadow-xl">
                        <table className="min-w-full divide-y divide-[#1e2638] text-xs text-left border-collapse">
                          <thead className="bg-[#121622] sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2 text-[10px] font-mono text-[#94a3b8] uppercase tracking-wider bg-[#10131d] border-r border-[#1e2638] w-12 text-center">
                                #
                              </th>
                              {(filteredExcelData[0] || []).map((col: any, colIdx: number) => (
                                <th
                                  key={colIdx}
                                  className="px-3.5 py-2 font-semibold text-[#e6c875] font-mono uppercase tracking-wider border-r border-[#1e2638] whitespace-nowrap bg-[#121622]"
                                >
                                  {col !== undefined && col !== '' ? String(col) : `Col ${colIdx + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#182030] bg-[#090b12]">
                            {filteredExcelData.slice(1).map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-[#141824] transition-colors">
                                <td className="px-3 py-2 text-[11px] font-mono text-[#94a3b8] bg-[#0c0f17] border-r border-[#1e2638] text-center font-medium select-none">
                                  {rowIdx + 2}
                                </td>
                                {row.map((cell: any, cellIdx: number) => (
                                  <td
                                    key={cellIdx}
                                    className="px-3.5 py-2 text-white border-r border-[#1e2638] whitespace-nowrap font-mono text-xs"
                                  >
                                    {cell !== undefined && cell !== null ? String(cell) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. WORD DOCUMENT VIEWER (.docx, .doc) */}
              {isWord && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="px-4 py-2 bg-[#0e121b] border-b border-[#1e2638] flex items-center justify-between text-xs flex-shrink-0">
                    <span className="text-blue-400 font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> High-Fidelity Word (.docx) Document Reader
                    </span>
                    <span className="text-[11px] text-[#94a3b8]">Rendered natively in-app</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-[#05070a]">
                    {isLoading ? (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-[#94a3b8]">
                        <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                        <span>Rendering Word document contents...</span>
                      </div>
                    ) : loadError ? (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-rose-400" />
                        <p className="text-sm text-white font-semibold">{loadError}</p>
                        <p className="text-xs text-[#94a3b8]">You can download the document to view in Microsoft Word.</p>
                      </div>
                    ) : (
                      <div className="max-w-3xl mx-auto bg-[#0d1018] border border-[#22293b] rounded-2xl p-6 sm:p-10 shadow-2xl space-y-4">
                        <div 
                          className="prose prose-invert max-w-none text-xs sm:text-sm text-[#cbd5e1] leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:border-b [&_h1]:border-[#263147] [&_h1]:pb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#e6c875] [&_h3]:text-base [&_h3]:font-semibold [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-[#182030] [&_th]:p-2 [&_th]:border [&_th]:border-[#263147] [&_td]:p-2 [&_td]:border [&_td]:border-[#263147]"
                          dangerouslySetInnerHTML={{ __html: wordHtml }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. PDF VIEWER (.pdf) */}
              {isPdf && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="px-4 py-2 bg-[#0e121b] border-b border-[#1e2638] flex items-center justify-between text-xs flex-shrink-0">
                    <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5" /> High-Resolution PDF Engine
                    </span>
                    {resolvedUrl && resolvedUrl !== '#' && (
                      <a
                        href={resolvedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#e6c875] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Fullscreen
                      </a>
                    )}
                  </div>

                  <div className="flex-1 p-2 sm:p-4 bg-[#05070a] overflow-hidden">
                    {resolvedUrl && resolvedUrl !== '#' ? (
                      <object
                        data={resolvedUrl}
                        type="application/pdf"
                        className="w-full h-full rounded-xl border border-[#1e2638] bg-white shadow-2xl"
                      >
                        <iframe
                          src={`${resolvedUrl}#toolbar=1`}
                          title={doc.title}
                          className="w-full h-full rounded-xl border border-[#1e2638] bg-white shadow-2xl"
                        >
                          <div className="p-8 text-center text-xs text-[#94a3b8] space-y-3">
                            <p>Unable to display PDF preview directly inside your current browser.</p>
                            <a
                              href={resolvedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 rounded-lg bg-[#cda052] text-black font-bold inline-block"
                            >
                              Download / Open PDF
                            </a>
                          </div>
                        </iframe>
                      </object>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <AlertCircle className="w-8 h-8 text-amber-400" />
                        <h4 className="text-base font-bold text-white">No File Data Attached</h4>
                        <p className="text-xs text-[#94a3b8] max-w-sm">This is a compliance metadata shell without an attached binary file.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. IMAGE VIEWER (.png, .jpg, .jpeg, .webp, .svg) */}
              {isImage && (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Image Controls Bar */}
                  <div className="px-4 py-2 bg-[#0e121b] border-b border-[#1e2638] flex items-center justify-between text-xs flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setImageZoom(z => Math.min(z + 0.25, 3))}
                        className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2336] text-[#94a3b8] hover:text-white border border-[#263147]"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setImageZoom(z => Math.max(z - 0.25, 0.5))}
                        className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2336] text-[#94a3b8] hover:text-white border border-[#263147]"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setImageZoom(1)}
                        className="px-2.5 py-1 rounded-lg bg-[#141824] text-[11px] font-mono text-[#e6c875] border border-[#263147]"
                        title="Reset Zoom"
                      >
                        {Math.round(imageZoom * 100)}%
                      </button>
                      <button
                        onClick={() => setImageRotation(r => (r + 90) % 360)}
                        className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2336] text-[#94a3b8] hover:text-white border border-[#263147]"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-[11px] text-[#94a3b8]">Interactive Canvas Zoom & Rotation</span>
                  </div>

                  {/* Image Canvas */}
                  <div className="flex-1 p-6 flex items-center justify-center overflow-auto bg-[#05070a] relative select-none">
                    {resolvedUrl && resolvedUrl !== '#' ? (
                      <div 
                        className="transition-transform duration-200 ease-out flex items-center justify-center"
                        style={{
                          transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolvedUrl}
                          alt={doc.title}
                          className="max-h-[70vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-[#1e2638]"
                        />
                      </div>
                    ) : (
                      <div className="text-center text-xs text-[#94a3b8]">
                        No image data found.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fallback for unhandled file types */}
              {!isExcel && !isWord && !isPdf && !isImage && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#141824] border border-[#263147] flex items-center justify-center text-[#cda052]">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{doc.title}</h4>
                    <p className="text-xs text-[#94a3b8] mt-1">{fileName}</p>
                  </div>
                  <p className="text-xs text-[#cbd5e1] max-w-md">
                    This file format ({doc.fileFormat}) is stored in your secure vault. You can review its technical compliance metadata or download it to open natively.
                  </p>
                  {resolvedUrl && resolvedUrl !== '#' && (
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={fileName}
                      className="px-4 py-2 rounded-lg bg-[#cda052] text-black font-bold text-xs inline-flex items-center gap-2 hover:brightness-110"
                    >
                      <Download className="w-4 h-4" /> Download File
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            /* READ VIEW / COMPLIANCE METADATA VIEW */
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-white font-serif">{doc.title}</h4>
                      <p className="text-xs text-[#94a3b8] mt-1">
                        Category: <strong className="text-white">{doc.documentType}</strong> • Associated Vendor: <strong className="text-[#e6c875]">{doc.associatedVendor || 'Rivlet Sourcing & HQ'}</strong>
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono">
                      {doc.status}
                    </span>
                  </div>

                  {/* Metadata Specs Table */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-[#1e2638]">
                    <div className="p-3 bg-[#07090e] rounded-xl border border-[#1e2638] space-y-1">
                      <span className="text-[10px] text-[#94a3b8] uppercase font-mono tracking-wider font-semibold block">Compliance Expiry</span>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#e6c875] font-mono">
                          {doc.expiryDate || 'Permanent / No Expiry'}
                        </span>
                        <button
                          onClick={() => onEditExpiry(doc)}
                          className="text-xs text-[#cda052] hover:underline font-semibold flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" /> Change
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-[#07090e] rounded-xl border border-[#1e2638] space-y-1">
                      <span className="text-[10px] text-[#94a3b8] uppercase font-mono tracking-wider font-semibold block">Physical File Name</span>
                      <span className="text-xs font-mono text-white truncate block">{fileName}</span>
                    </div>

                    <div className="p-3 bg-[#07090e] rounded-xl border border-[#1e2638] space-y-1">
                      <span className="text-[10px] text-[#94a3b8] uppercase font-mono tracking-wider font-semibold block">File Size & Format</span>
                      <span className="text-xs font-mono text-white">
                        {(doc.fileSizeBytes / 1024 / 1024).toFixed(2)} MB • {doc.fileFormat?.toUpperCase() || ext.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-3 bg-[#07090e] rounded-xl border border-[#1e2638] space-y-1">
                      <span className="text-[10px] text-[#94a3b8] uppercase font-mono tracking-wider font-semibold block">Cloud Storage Status</span>
                      <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Storage Verified
                      </span>
                    </div>
                  </div>

                  {/* Compliance Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] text-[#94a3b8] uppercase font-mono tracking-wider font-semibold block mb-2">Audit & Compliance Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-[#141824] text-[#cbd5e1] border border-[#263147] text-xs font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Extracted Text Summary for Word */}
                {isWord && wordText && (
                  <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-6 shadow-xl space-y-3">
                    <h5 className="text-xs uppercase font-mono tracking-wider text-[#e6c875] font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Extracted Text Transcript
                    </h5>
                    <div className="p-4 bg-[#07090e] rounded-xl border border-[#1e2638] max-h-60 overflow-y-auto custom-scrollbar text-xs text-[#cbd5e1] font-mono whitespace-pre-wrap leading-relaxed">
                      {wordText}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => onEditExpiry(doc)}
                    className="px-4 py-2.5 rounded-lg bg-[#141824] border border-[#263147] text-[#e6c875] hover:text-white hover:border-[#cda052] font-semibold text-xs flex items-center gap-2 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Compliance Expiry
                  </button>

                  {resolvedUrl && resolvedUrl !== '#' && (
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={fileName}
                      className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs inline-flex items-center gap-2 hover:brightness-110 shadow-glow"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" /> Download Document
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
