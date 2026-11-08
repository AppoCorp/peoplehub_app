import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleProxy(request);
}

export async function POST(request: NextRequest) {
  return handleProxy(request);
}

export async function PUT(request: NextRequest) {
  return handleProxy(request);
}

export async function PATCH(request: NextRequest) {
  return handleProxy(request);
}

export async function DELETE(request: NextRequest) {
  return handleProxy(request);
}

// Hosts the app may talk to (each also allows its subdomains); add more with ALLOWED_API_HOSTS=a.com,b.com
const ALLOWED_HOSTS = ['appo.co.in', 'peoplehub.in', ...(process.env.ALLOWED_API_HOSTS || '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)];

function isAllowedTarget(baseUrl: string, targetPath: string): boolean {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase();
  const hostAllowed = ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  const isLocalDev = process.env.NODE_ENV === 'development' && (host === 'localhost' || host === '127.0.0.1');

  return (hostAllowed && url.protocol === 'https:' || isLocalDev)
    && !url.username && !url.password && (url.pathname === '/' || url.pathname === '')
    && targetPath.startsWith('/api/v1/') && !targetPath.includes('..') && !targetPath.includes('@');
}

async function handleProxy(request: NextRequest) {
  try {
    const baseUrl = request.headers.get('x-base-url');
    const targetPath = request.headers.get('x-target-path');
    
    if (!baseUrl || !targetPath) {
      return NextResponse.json(
        { message: 'Missing routing headers: x-base-url or x-target-path' },
        { status: 400 }
      );
    }

    // Standardize URL formatting
    let formattedBaseUrl = baseUrl.trim();
    if (!formattedBaseUrl.startsWith('http')) {
      formattedBaseUrl = `https://${formattedBaseUrl}`;
    }
    formattedBaseUrl = formattedBaseUrl.replace(/\/+$/, '');

    // Only relay to PeopleHub servers and their mobile API, never to any other site
    if (!isAllowedTarget(formattedBaseUrl, targetPath)) {
      return NextResponse.json({ message: 'This server is not allowed.' }, { status: 400 });
    }

    const targetUrl = `${formattedBaseUrl}${targetPath}`;

    const headers = new Headers();
    const auth = request.headers.get('authorization');
    if (auth) {
      headers.set('authorization', auth);
    }

    const contentType = request.headers.get('content-type') || '';
    
    let body: any = undefined;

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      if (contentType.includes('multipart/form-data')) {
        // Parse incoming multipart request
        const incomingFormData = await request.formData();
        const outgoingFormData = new FormData();
        
        for (const [key, value] of incomingFormData.entries()) {
          if (value instanceof File) {
            // Forward the file correctly
            outgoingFormData.append(key, value, value.name);
          } else {
            outgoingFormData.append(key, value);
          }
        }
        
        body = outgoingFormData;
        // Notice: Do NOT set Content-Type header manually for multipart requests!
        // Fetch will automatically generate the correct boundary.
      } else {
        const text = await request.text();
        if (text && text.trim().length > 0) {
          headers.set('content-type', 'application/json');
          body = text;
        }
      }
    }

    // Call the target HRMS endpoint server-side (bypassing CORS)
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    // A PDF (the policy viewer) is passed through as bytes; everything else is JSON or text
    if ((res.headers.get('content-type') || '').includes('application/pdf')) {
      return new Response(await res.arrayBuffer(), {
        status: res.status,
        headers: { 'content-type': 'application/pdf', 'cache-control': 'no-store, private' },
      });
    }

    const dataText = await res.text();
    let data;
    try {
      data = JSON.parse(dataText);
    } catch {
      data = dataText;
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal proxy router error' },
      { status: 500 }
    );
  }
}
