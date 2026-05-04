'use server'

import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { OrderStatus } from '@prisma/client'

async function requireAdmin() {
  const ok = await verifyAdminSession()
  // The admin login page lives at /admin (inline form, not a separate
  // /admin/login route). Don't change this without also adding the page.
  if (!ok) redirect('/admin')
}

// ────────────────────────────────────────────────────────────────────
// Clients
// ────────────────────────────────────────────────────────────────────
export async function createClient(formData: FormData) {
  await requireAdmin()
  const name = String(formData.get('name') || '').trim()
  const contactEmail = String(formData.get('contactEmail') || '').trim()
  const ccEmails = String(formData.get('ccEmails') || '').trim() || null
  const notes = String(formData.get('notes') || '').trim() || null
  if (!name || !contactEmail) throw new Error('name and contactEmail are required')

  const client = await prisma.institutionalClient.create({
    data: { name, contactEmail, ccEmails, notes },
  })
  revalidatePath('/admin/institutional/clients')
  redirect(`/admin/institutional/clients/${client.id}`)
}

// ────────────────────────────────────────────────────────────────────
// Orders
// ────────────────────────────────────────────────────────────────────
export async function createOrder(formData: FormData) {
  await requireAdmin()
  const clientId = String(formData.get('clientId') || '')
  if (!clientId) throw new Error('clientId required')

  const data: any = {
    clientId,
    patientName: String(formData.get('patientName') || '').trim(),
    patientContactName: String(formData.get('patientContactName') || '').trim() || null,
    patientPhone: String(formData.get('patientPhone') || '').trim(),
    patientEmail: String(formData.get('patientEmail') || '').trim() || null,
    patientAddress: String(formData.get('patientAddress') || '').trim(),
    patientCity: String(formData.get('patientCity') || '').trim(),
    patientState: String(formData.get('patientState') || '').trim().toUpperCase(),
    patientZip: String(formData.get('patientZip') || '').trim(),
    patientNotes: String(formData.get('patientNotes') || '').trim() || null,
    protocolNotes: String(formData.get('protocolNotes') || '').trim() || null,
    clientRate: String(formData.get('clientRate') || '0'),
  }
  // Required fields
  for (const k of ['patientName', 'patientPhone', 'patientAddress', 'patientCity', 'patientState', 'patientZip']) {
    if (!data[k]) throw new Error(`${k} required`)
  }

  const order = await prisma.institutionalOrder.create({ data })
  revalidatePath(`/admin/institutional/clients/${clientId}`)
  redirect(`/admin/institutional/orders/${order.id}`)
}

// Generic field update — used by inline edits on the order detail page.
// Accepts any subset of editable fields; ignores anything else.
export async function updateOrder(orderId: string, formData: FormData) {
  await requireAdmin()
  const allowed = new Set([
    'patientName', 'patientContactName', 'patientPhone', 'patientEmail',
    'patientAddress', 'patientCity', 'patientState', 'patientZip',
    'patientNotes', 'protocolNotes',
    'clientRate', 'providerRate',
    'assignedProviderId',
    'status',
    'fedexTrackingNum',
  ])
  const data: any = {}
  for (const [k, v] of formData.entries()) {
    if (!allowed.has(k)) continue
    const s = String(v).trim()
    if (k === 'clientRate' || k === 'providerRate') {
      data[k] = s === '' ? null : s
    } else if (k === 'assignedProviderId') {
      data[k] = s === '' ? null : s
    } else {
      data[k] = s === '' ? null : s
    }
  }
  await prisma.institutionalOrder.update({ where: { id: orderId }, data })
  revalidatePath(`/admin/institutional/orders/${orderId}`)
}

// "Set to now" action — sets one timestamp field to the current time.
// Field name comes from the form's "field" input.
export async function setTimestampNow(orderId: string, formData: FormData) {
  await requireAdmin()
  const field = String(formData.get('field') || '')
  const allowed = new Set(['kitShippedAt', 'kitReceivedAt', 'scheduledAt', 'drawCompletedAt', 'fedexDroppedAt'])
  if (!allowed.has(field)) throw new Error(`field "${field}" not allowed`)
  await prisma.institutionalOrder.update({
    where: { id: orderId },
    data: { [field]: new Date() },
  })
  revalidatePath(`/admin/institutional/orders/${orderId}`)
}

export async function clearTimestamp(orderId: string, formData: FormData) {
  await requireAdmin()
  const field = String(formData.get('field') || '')
  const allowed = new Set(['kitShippedAt', 'kitReceivedAt', 'scheduledAt', 'drawCompletedAt', 'fedexDroppedAt', 'scheduledFor'])
  if (!allowed.has(field)) throw new Error(`field "${field}" not allowed`)
  await prisma.institutionalOrder.update({
    where: { id: orderId },
    data: { [field]: null },
  })
  revalidatePath(`/admin/institutional/orders/${orderId}`)
}

// scheduledFor takes a date+time input from a datetime-local control.
export async function setScheduledFor(orderId: string, formData: FormData) {
  await requireAdmin()
  const raw = String(formData.get('scheduledFor') || '')
  const value = raw ? new Date(raw) : null
  await prisma.institutionalOrder.update({
    where: { id: orderId },
    data: { scheduledFor: value },
  })
  revalidatePath(`/admin/institutional/orders/${orderId}`)
}

export async function setStatus(orderId: string, formData: FormData) {
  await requireAdmin()
  const status = String(formData.get('status') || '') as OrderStatus
  await prisma.institutionalOrder.update({
    where: { id: orderId },
    data: { status },
  })
  revalidatePath(`/admin/institutional/orders/${orderId}`)
}
