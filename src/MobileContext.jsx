import { createContext, useContext } from 'react'

export const MobileContext = createContext(false)

export function useMobile() {
  return useContext(MobileContext)
}
