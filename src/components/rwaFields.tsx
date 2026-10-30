/* eslint-disable react-refresh/only-export-components */
import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Rwa } from '../lib/types'
import { isEmail, isPhone, isPin } from '../lib/utils'
import { ImagePicker } from './shared'
import { Card, CardHeader, Field, Input, Notice } from './ui'

export interface RwaDraft {
  name: string
  logo?: string
  address: string
  city: string
  state: string
  pin: string
  units: string
  regNo: string
  presidentName: string
  presidentPhone: string
  adminName: string
  adminEmail: string
  adminPhone: string
}

export const emptyDraft = (): RwaDraft => ({
  name: '',
  address: '',
  city: '',
  state: '',
  pin: '',
  units: '',
  regNo: '',
  presidentName: '',
  presidentPhone: '',
  adminName: '',
  adminEmail: '',
  adminPhone: '',
})

export const draftFromRwa = (r: Rwa): RwaDraft => ({
  name: r.name,
  logo: r.logo,
  address: r.address,
  city: r.city,
  state: r.state,
  pin: r.pin,
  units: String(r.units || ''),
  regNo: r.regNo ?? '',
  presidentName: r.presidentName,
  presidentPhone: r.presidentPhone,
  adminName: r.adminName,
  adminEmail: r.adminEmail,
  adminPhone: r.adminPhone,
})

export type DraftErrors = Partial<Record<keyof RwaDraft, string>>

export function validateDraft(d: RwaDraft): DraftErrors {
  const e: DraftErrors = {}
  if (!d.name.trim()) e.name = 'Society name is required'
  if (!d.address.trim()) e.address = 'Address is required'
  if (!d.city.trim()) e.city = 'City is required'
  if (!d.state.trim()) e.state = 'State is required'
  if (d.pin && !isPin(d.pin)) e.pin = 'PIN code must be 6 digits'
  if (!d.units || Number(d.units) < 1) e.units = 'Enter the number of units'
  if (!d.presidentName.trim()) e.presidentName = 'President’s name is required'
  if (d.presidentPhone && !isPhone(d.presidentPhone)) e.presidentPhone = 'Enter a valid 10-digit mobile number'
  if (!d.adminName.trim()) e.adminName = 'Administrator’s name is required'
  if (!d.adminEmail.trim()) e.adminEmail = 'Administrator’s email is required'
  else if (!isEmail(d.adminEmail)) e.adminEmail = 'Enter a valid email address'
  if (!d.adminPhone.trim()) e.adminPhone = 'Administrator’s phone is required'
  else if (!isPhone(d.adminPhone)) e.adminPhone = 'Enter a valid 10-digit mobile number'
  return e
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

export function findDuplicate(d: RwaDraft, rwas: Rwa[], excludeId?: string) {
  if (!d.name.trim() || !d.city.trim()) return undefined
  return rwas.find((r) => r.id !== excludeId && norm(r.name) === norm(d.name) && norm(r.city) === norm(d.city))
}

export function draftToRwaFields(d: RwaDraft) {
  return {
    name: d.name.trim(),
    logo: d.logo,
    address: d.address.trim(),
    city: d.city.trim(),
    state: d.state.trim(),
    pin: d.pin.trim(),
    units: Number(d.units) || 0,
    regNo: d.regNo.trim() || undefined,
    presidentName: d.presidentName.trim(),
    presidentPhone: d.presidentPhone.trim(),
    adminName: d.adminName.trim(),
    adminEmail: d.adminEmail.trim(),
    adminPhone: d.adminPhone.trim(),
  }
}

export function RwaFields({
  draft,
  errors,
  onChange,
  duplicate,
  extra,
}: {
  draft: RwaDraft
  errors: DraftErrors
  onChange: (d: RwaDraft) => void
  duplicate?: Rwa
  extra?: ReactNode
}) {
  const set = <K extends keyof RwaDraft>(k: K) => (e: { target: { value: string } }) => onChange({ ...draft, [k]: e.target.value })
  const text = (k: keyof RwaDraft, label: string, opts: { placeholder?: string; optional?: boolean; type?: string; className?: string; inputMode?: 'numeric' | 'tel' | 'email' } = {}) => (
    <Field label={label} error={errors[k]} optional={opts.optional} className={opts.className}>
      {(id) => (
        <Input
          id={id}
          type={opts.type ?? 'text'}
          inputMode={opts.inputMode}
          value={(draft[k] as string) ?? ''}
          onChange={set(k)}
          placeholder={opts.placeholder}
          invalid={!!errors[k]}
        />
      )}
    </Field>
  )

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Society profile" description="Basic information about the residential society." />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {text('name', 'Society name', { placeholder: 'e.g. Palm Grove Residency', className: 'sm:col-span-2' })}
          {duplicate && (
            <Notice tone="warning" className="sm:col-span-2">
              <span className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  A society named <b>{duplicate.name}</b> already exists in {duplicate.city} ({duplicate.status}). Please double-check this isn’t a duplicate record.
                </span>
              </span>
            </Notice>
          )}
          <Field label="Society logo" optional className="sm:col-span-2" hint="Initials are used when no logo is uploaded.">
            {() => <ImagePicker value={draft.logo} onChange={(logo) => onChange({ ...draft, logo })} label="Upload logo" shape="square" />}
          </Field>
          {text('address', 'Complete address', { placeholder: 'Plot / street / sector', className: 'sm:col-span-2' })}
          {text('city', 'City')}
          {text('state', 'State')}
          {text('pin', 'PIN code', { optional: true, inputMode: 'numeric', placeholder: '6 digits' })}
          {text('units', 'Residential units', { type: 'number', inputMode: 'numeric', placeholder: 'e.g. 240' })}
          {text('regNo', 'RWA registration number', { optional: true, className: 'sm:col-span-2' })}
        </div>
      </Card>
      <Card>
        <CardHeader title="Contacts" description="Use fictional details in this demo. No invitations are sent." />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {text('presidentName', 'President’s name')}
          {text('presidentPhone', 'President’s contact number', { optional: true, inputMode: 'tel', placeholder: '+91 98000 12345' })}
          {text('adminName', 'Administrator’s name')}
          {text('adminEmail', 'Administrator’s email', { type: 'email', inputMode: 'email', placeholder: 'admin@society.example' })}
          {text('adminPhone', 'Administrator’s contact number', { inputMode: 'tel', placeholder: '+91 98000 12345' })}
        </div>
      </Card>
      {extra}
    </div>
  )
}
