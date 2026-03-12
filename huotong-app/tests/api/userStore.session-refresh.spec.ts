import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { getSessionMock, onAuthStateChangeMock, signInWithPasswordMock, signOutMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  signInWithPasswordMock: vi.fn(),
  signOutMock: vi.fn(),
}))

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
    },
  },
}))

import { useUserStore, type SessionRefreshResult } from '../../src/stores/user'

describe('user store refreshSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('会话有效时保留登录状态', async () => {
    const fakeSession = {
      user: { id: 'u-1', email: 'demo@test.com' },
    }
    getSessionMock.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    })

    const store = useUserStore()
    const valid = await store.refreshSession()

    expect(valid).toBe<SessionRefreshResult>('valid')
    expect(store.isLoggedIn).toBe(true)
    expect(store.user?.id).toBe('u-1')
  })

  it('会话失效时清空登录状态', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    const store = useUserStore()
    const valid = await store.refreshSession()

    expect(valid).toBe<SessionRefreshResult>('invalid')
    expect(store.isLoggedIn).toBe(false)
    expect(store.user).toBeNull()
  })

  it('会话复检报错时保留当前登录状态', async () => {
    const fakeSession = {
      user: { id: 'u-1', email: 'demo@test.com' },
    }
    getSessionMock.mockResolvedValueOnce({
      data: { session: fakeSession },
      error: null,
    })
    getSessionMock.mockResolvedValueOnce({
      data: { session: null },
      error: new Error('network down'),
    })

    const store = useUserStore()
    await store.refreshSession()
    const result = await store.refreshSession()

    expect(result).toBe<SessionRefreshResult>('error')
    expect(store.isLoggedIn).toBe(true)
    expect(store.user?.id).toBe('u-1')
  })
})
