import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'MANAGER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  billing_cycle: 'MONTHLY' | 'YEARLY'
  stripe_price_id: string | null
  stripe_product_id: string | null
  features: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE'
  billing_cycle: 'MONTHLY' | 'YEARLY'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  subscription_id: string | null
  stripe_payment_intent_id: string | null
  stripe_invoice_id: string | null
  amount: number
  currency: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'CANCELED'
  payment_method: string | null
  description: string | null
  paid_at: string | null
  created_at: string
}

export interface License {
  id: string
  code: string
  is_used: boolean
  device_id: string | null
  device_type: string | null
  expire_date: string | null
  activated_at: string | null
  created_at: string
  client: string | null
  company: string
  sold: boolean
  subscription_id: string | null
  user_id: string | null
  plan_type: string | null
  is_standalone: boolean
}

// Funções auxiliares para autenticação
export const authApi = {
  async login(email: string, password: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/auth-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    return response.json()
  },

  async register(email: string, password: string, name: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/auth-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ email, password, name }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    return response.json()
  },

  async logout() {
    await supabase.auth.signOut()
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async getCurrentUser(token: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/user-management?action=getCurrentUser`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get current user')
    }

    return response.json()
  },
}

// Funções para gerenciamento de usuários
export const userApi = {
  async getUsers(token: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/user-management`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch users')
    }

    return response.json()
  },

  async getUser(token: string, userId: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/user-management?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch user')
    }

    return response.json()
  },

  async updateUser(token: string, userId: string, data: Partial<User>) {
    const response = await fetch(`${supabaseUrl}/functions/v1/user-management?userId=${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update user')
    }

    return response.json()
  },

  async deleteUser(token: string, userId: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/user-management?userId=${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete user')
    }

    return response.json()
  },
}

// Funções para gerenciamento de licenças standalone
export const licenseApi = {
  async getLicenses(token: string, standalone: boolean = false) {
    const url = `${supabaseUrl}/functions/v1/license-management${standalone ? '?standalone=true' : ''}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch licenses')
    }

    return response.json()
  },

  async createLicense(token: string, data: { client?: string; company: string; plan_type?: string; expire_days?: number }) {
    const response = await fetch(`${supabaseUrl}/functions/v1/license-management?action=create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create license')
    }

    return response.json()
  },

  async updateLicense(token: string, licenseId: string, data: Partial<License>) {
    const response = await fetch(`${supabaseUrl}/functions/v1/license-management?licenseId=${licenseId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update license')
    }

    return response.json()
  },

  async unbindDevice(token: string, licenseId: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/license-management?action=unbind&licenseId=${licenseId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to unbind device')
    }

    return response.json()
  },

  async deleteLicense(token: string, licenseId: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/license-management?licenseId=${licenseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete license')
    }

    return response.json()
  },
}

// Funções para checkout e pagamentos
export const checkoutApi = {
  async createCheckoutSession(token: string, planId: string, successUrl: string, cancelUrl: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        plan_id: planId,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create checkout session')
    }

    return response.json()
  },
}

// Funções para acessar dados diretamente via Supabase Client
export const db = {
  plans: {
    async getAll() {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('billing_cycle', { ascending: true })

      if (error) throw error
      return data as Plan[]
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Plan
    },
  },

  subscriptions: {
    async getByUser(userId: string) {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  },

  payments: {
    async getByUser(userId: string) {
      const { data, error } = await supabase
        .from('payments')
        .select('*, subscriptions(*, plans(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  },

  licenses: {
    async getByUser(userId: string) {
      const { data, error } = await supabase
        .from('licenses')
        .select('*, subscriptions(*, plans(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as License[]
    },
  },

  systemSettings: {
    async getAll() {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')

      if (error) throw error
      return data as SystemSetting[]
    },

    async getByKey(key: string) {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .single()

      if (error) throw error
      return data as SystemSetting
    },

    async update(key: string, value: string) {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ value })
        .eq('key', key)
        .select()
        .single()

      if (error) throw error
      return data as SystemSetting
    },
  },

  systemVersions: {
    async getAll() {
      const { data, error } = await supabase
        .from('system_versions')
        .select('*')
        .eq('is_active', true)
        .order('release_date', { ascending: false })

      if (error) throw error
      return data as SystemVersion[]
    },

    async getLatest() {
      const { data, error } = await supabase
        .from('system_versions')
        .select('*')
        .eq('is_latest', true)
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data as SystemVersion
    },

    async create(version: Omit<SystemVersion, 'id' | 'created_at' | 'updated_at'>) {
      const { data, error } = await supabase
        .from('system_versions')
        .insert(version)
        .select()
        .single()

      if (error) throw error
      return data as SystemVersion
    },

    async update(id: string, updates: Partial<SystemVersion>) {
      const { data, error } = await supabase
        .from('system_versions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SystemVersion
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('system_versions')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
  },
}

// Novos tipos
export interface VerificationCode {
  id: string
  user_id: string
  code: string
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET'
  email: string
  expires_at: string
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface SystemSetting {
  id: string
  key: string
  value: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface SystemVersion {
  id: string
  version: string
  release_date: string
  download_url: string
  file_size: string | null
  release_notes: string | null
  is_latest: boolean
  is_active: boolean
  minimum_requirements: string | null
  minimum_processor: string | null
  minimum_ram: string | null
  minimum_storage: string | null
  minimum_os: string | null
  created_at: string
  updated_at: string
}

// Função para enviar email de verificação
export const emailApi = {
  async sendVerificationEmail(userId: string, email: string, name: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-verification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ userId, email, name }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send verification email')
    }

    return response.json()
  },

  async sendPasswordResetEmail(email: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-password-reset-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send password reset email')
    }

    return response.json()
  },

  async verifyEmailCode(code: string, userId: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/verify-email-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ code, userId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to verify email code')
    }

    return response.json()
  },

  async verifyPasswordResetCode(code: string, email: string, newPassword: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/verify-password-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ code, email, newPassword }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to verify password reset code')
    }

    return response.json()
  },
}
