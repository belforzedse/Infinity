import { atom } from 'jotai'
import type { UserAddress } from '@/services/user/addresses'

/**
 * Global state for user addresses
 * Used for real-time updates across the addresses page
 */
export const addressesAtom = atom<UserAddress[]>([])

/**
 * Loading state for addresses
 */
export const addressesLoadingAtom = atom<boolean>(false)

/**
 * Error state for addresses
 */
export const addressesErrorAtom = atom<string | null>(null)
