import { commercialDateInput } from '../../lib/formatters.js'

const PAYMENT_METHODS = ['cash', 'transfer']

function recordBusinessId(record) {
  return record?.business_id ?? record?.businessId
}

export function filterBusinessFinancialRecords({ payments = [], manualTransactions = [], orders, businessId }) {
  if (!businessId) return { payments: [], manualTransactions: [] }

  const orderById = new Map((orders ?? []).map((order) => [order.id, order]))
  return {
    payments: payments.filter((payment) => (
      recordBusinessId(payment) === businessId
      && (orders === undefined || recordBusinessId(orderById.get(payment.orderId)) === businessId)
    )),
    manualTransactions: manualTransactions.filter((transaction) => recordBusinessId(transaction) === businessId),
  }
}

function inDateRange(date, startDate, endDate) {
  return Boolean(date) && date >= startDate && date <= endDate
}

export function calculateReportFinancials({ payments = [], manualTransactions = [], orders, businessId, startDate, endDate }) {
  const scopedRecords = filterBusinessFinancialRecords({ payments, manualTransactions, orders, businessId })
  const confirmedPayments = scopedRecords.payments.filter((payment) => {
    if (payment.status !== 'CONFIRMED') return false
    const method = payment.method ?? payment.paymentMethod
    if (!PAYMENT_METHODS.includes(method)) return false
    const effectiveDate = commercialDateInput(payment.confirmedAt ?? payment.createdAt)
    return inDateRange(effectiveDate, startDate, endDate)
  })
  const inPeriodManual = scopedRecords.manualTransactions.filter((transaction) => (
    PAYMENT_METHODS.includes(transaction.paymentMethod)
    && inDateRange(transaction.date, startDate, endDate)
    && ['income', 'expense'].includes(transaction.type)
  ))
  const sum = (transactions) => transactions.reduce((total, transaction) => total + Number(transaction.amount || 0), 0)
  const byMethod = (method) => {
    const serviceIncome = sum(confirmedPayments.filter((payment) => (payment.method ?? payment.paymentMethod) === method))
    const manualIncome = sum(inPeriodManual.filter((transaction) => transaction.type === 'income' && transaction.paymentMethod === method))
    const expenses = sum(inPeriodManual.filter((transaction) => transaction.type === 'expense' && transaction.paymentMethod === method))
    return { serviceIncome, manualIncome, expenses, netBalance: serviceIncome + manualIncome - expenses }
  }
  const cash = byMethod('cash')
  const transfer = byMethod('transfer')
  const serviceIncome = cash.serviceIncome + transfer.serviceIncome
  const manualIncome = cash.manualIncome + transfer.manualIncome
  const totalIncome = serviceIncome + manualIncome
  const expenses = cash.expenses + transfer.expenses

  return {
    payments: confirmedPayments,
    manualTransactions: inPeriodManual,
    serviceIncome,
    manualIncome,
    totalIncome,
    expenses,
    netBalance: totalIncome - expenses,
    cash,
    transfer,
  }
}
