export function normalizeWhatsAppNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `57${digits}`
  return digits.length >= 11 && digits.length <= 15 ? digits : ''
}

export function createConsultationWhatsAppUrl({ whatsapp, consultationCode, publicUrl, businessName, clientName, plate, serviceName }) {
  const phone = normalizeWhatsAppNumber(whatsapp)
  if (!phone || !/^\d{4}$/.test(String(consultationCode ?? '')) || !publicUrl || !clientName?.trim() || !plate?.trim() || !serviceName?.trim()) return null

  const message = [
    `Hola ${clientName.trim()}, gracias por confiar en ${businessName?.trim() || 'Lavado Detailling'}.`,
    '',
    'Tu vehículo fue registrado para el servicio.',
    `Vehículo: ${plate.trim()}`,
    `Servicio: ${serviceName.trim()}`,
    '',
    `Código de consulta: ${consultationCode}`,
    '',
    `Puedes consultar el estado de tu vehículo aquí: ${publicUrl}`,
    '',
    'Guarda este código para consultar el estado de tu servicio.',
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
