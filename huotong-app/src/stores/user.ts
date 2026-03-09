import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)

  const isLoggedIn = computed(() => !!session.value)

  async function initSession() {
    const { data: { session: s }, error } = await supabase.auth.getSession()
    if (!error && s) {
      session.value = s
      user.value = s.user
    } else {
      session.value = null
      user.value = null
    }
  }

  function setAuth(s: Session | null) {
    session.value = s
    user.value = s?.user ?? null
  }

  function subscribeAuth() {
    supabase.auth.onAuthStateChange((_event, s) => {
      setAuth(s)
    })
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.session) setAuth(data.session)
  }

  async function logout() {
    await supabase.auth.signOut()
    setAuth(null)
  }

  return {
    user,
    session,
    isLoggedIn,
    initSession,
    subscribeAuth,
    login,
    logout,
  }
})
