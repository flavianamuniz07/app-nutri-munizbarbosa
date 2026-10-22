import { createAuthClient } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'

// Configura o cliente de autenticação do Neon Auth (Better Auth)
const neonAuthBaseUrl = import.meta.env.VITE_NEON_AUTH_URL || 'https://auth.neon.tech'

export const neonAuthClient = createAuthClient(neonAuthBaseUrl, {
  adapter: BetterAuthReactAdapter(),
})
