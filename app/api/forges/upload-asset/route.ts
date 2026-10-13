import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

const MAX_SIZE = 50 * 1024 * 1024
const ALLOWED_MIME = new Set(['application/pdf'])

async function isRealPdf(buffer: Buffer): Promise<boolean> {
  if (buffer.length < 5) return false
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-'
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'file.pdf'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    const forgeId = form.get('forgeId') as string | null
    const assetKey = form.get('assetKey') as string | null

    if (!file || !forgeId || !assetKey) {
      return NextResponse.json({ error: 'Missing file, forgeId, or assetKey' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 })
    if (file.size === 0) return NextResponse.json({ error: 'Empty file' }, { status: 400 })

    const { data: forge, error: forgeError } = await supabase
      .from('forges')
      .select('id, user_id')
      .eq('id', forgeId)
      .single()

    if (forgeError || !forge) return NextResponse.json({ error: 'Forge not found' }, { status: 404 })
    if (forge.user_id !== user.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 })

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 415 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!(await isRealPdf(buffer))) {
      return NextResponse.json({ error: 'File is not a valid PDF' }, { status: 415 })
    }

    const safeName = safeFilename(file.name)
    const assetId = randomUUID()
    const dir = join(process.cwd(), 'uploads', 'forges', forgeId)
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, `${assetId}-${safeName}`)
    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/forges/${forgeId}/${assetId}-${safeName}`

    await supabase.from('forge_assets').insert({
      id: assetId,
      forge_id: forgeId,
      asset_key: assetKey,
      filename: safeName,
      mime: 'application/pdf',
      size: file.size,
      url: publicUrl,
    })

    return NextResponse.json({ ok: true, url: publicUrl, assetKey })
  } catch (err) {
    console.error('[upload-asset]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
