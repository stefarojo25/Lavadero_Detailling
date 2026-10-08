import { useContext } from 'react'
import { BusinessDataContext } from './businessDataContext.js'

export function useBusinessData() {
  const context = useContext(BusinessDataContext)
  if (!context) throw new Error('useBusinessData debe utilizarse dentro de BusinessDataProvider')
  return context
}