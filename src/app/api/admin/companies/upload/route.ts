import { NextResponse } from 'next/server';
import { writeFile, access, mkdir } from 'fs/promises';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'Admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file || !file.name) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = './public/images/company-logos';
    
    try {
      await access(uploadDir);
    } catch {
      await mkdir(uploadDir, { recursive: true });
    }

    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    const filepath = `${uploadDir}/${filename}`;

    await writeFile(filepath, buffer);

    const publicPath = `images/company-logos/${filename}`;
    return NextResponse.json({ logo: publicPath });
  } catch (err) {
    console.error('Upload error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}