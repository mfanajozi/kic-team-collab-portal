import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
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

    const uploadDir = 'public/images/company-logos';
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {}

    const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    const filepath = `${uploadDir}/${filename}`;

    await writeFile(filepath, buffer);

    const publicPath = `images/company-logos/${filename}`;
    return NextResponse.json({ logo: publicPath });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}