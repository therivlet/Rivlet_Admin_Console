import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Check if this is a Supabase vault-files storage URL
    const marker = '/storage/v1/object/public/vault-files/';
    const signMarker = '/storage/v1/object/sign/vault-files/';

    let buffer: ArrayBuffer | null = null;
    let contentType = 'application/pdf';

    if (url.includes(marker) || url.includes(signMarker)) {
      const activeMarker = url.includes(marker) ? marker : signMarker;
      const markerIdx = url.indexOf(activeMarker);
      const filePath = decodeURIComponent(url.slice(markerIdx + activeMarker.length).split('?')[0]);

      try {
        const { data, error } = await supabaseAdmin.storage.from('vault-files').download(filePath);
        if (!error && data) {
          buffer = await data.arrayBuffer();
          contentType = data.type || 'application/pdf';
        }
      } catch (adminErr) {
        console.warn('supabaseAdmin download fallback to direct fetch:', adminErr);
      }
    }

    // If not fetched via storage admin, fetch via HTTP
    if (!buffer) {
      const res = await fetch(url);
      if (!res.ok) {
        return new NextResponse(`Failed to fetch PDF: ${res.status} ${res.statusText}`, {
          status: res.status,
        });
      }
      buffer = await res.arrayBuffer();
      contentType = res.headers.get('content-type') || 'application/pdf';
    }

    // Ensure it has application/pdf content type if serving a PDF
    if (!contentType || contentType === 'application/octet-stream' || url.toLowerCase().includes('.pdf')) {
      contentType = 'application/pdf';
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('PDF Proxy error:', err);
    return new NextResponse(err?.message || 'Internal PDF Proxy Error', { status: 500 });
  }
}
