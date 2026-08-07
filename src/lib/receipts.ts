export interface Receipt {
  id: string
  caseId: string
  clientName: string
  email: string
  fileName: string
  size: string
  uploadedAt: string
  dataUrl: string
  verified: boolean
}

const KEY = 'cwt_payment_receipts'

export function getReceipts(): Receipt[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as Receipt[]
  } catch {
    return []
  }
}

export function addReceipt(r: Omit<Receipt, 'id' | 'uploadedAt' | 'verified'>): Receipt {
  const receipt: Receipt = {
    ...r,
    id: `RCP-${Date.now().toString(36).toUpperCase()}`,
    uploadedAt: new Date().toISOString(),
    verified: false,
  }
  localStorage.setItem(KEY, JSON.stringify([receipt, ...getReceipts()]))
  return receipt
}

export function setReceiptVerified(id: string, verified: boolean) {
  localStorage.setItem(KEY, JSON.stringify(getReceipts().map(r => (r.id === id ? { ...r, verified } : r))))
}

export function deleteReceipt(id: string) {
  localStorage.setItem(KEY, JSON.stringify(getReceipts().filter(r => r.id !== id)))
}
