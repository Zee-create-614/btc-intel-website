// Authentication and user management system
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const USERS_DIR = join(process.cwd(), 'data')
const USERS_FILE = join(USERS_DIR, 'users.jsonl')

// Ensure users directory exists
if (!existsSync(USERS_DIR)) {
  require('fs').mkdirSync(USERS_DIR, { recursive: true })
}

export interface User {
  id: string
  email: string
  password_hash: string
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise'
  created_at: string
  last_login?: string
  is_verified: boolean
  verification_token?: string
  reset_token?: string
  subscription_expires?: string
  api_key?: string
}

export interface UserSession {
  user_id: string
  email: string
  subscription_tier: string
  created_at: string
  expires_at: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'btc-intel-vault-secret-key-2026'
const SALT_ROUNDS = 12

// Create a new user
export async function createUser(email: string, password: string, subscriptionTier: 'free' | 'basic' | 'pro' | 'enterprise' = 'free'): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return { success: false, error: 'User already exists' }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    
    // Create user
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      subscription_tier: subscriptionTier,
      created_at: new Date().toISOString(),
      is_verified: false,
      verification_token: Math.random().toString(36).substring(7),
      api_key: generateApiKey()
    }

    // Save to file
    const userLine = JSON.stringify(user) + '\n'
    if (existsSync(USERS_FILE)) {
      require('fs').appendFileSync(USERS_FILE, userLine)
    } else {
      writeFileSync(USERS_FILE, userLine)
    }

    // Remove sensitive data from response
    const { password_hash, verification_token, reset_token, ...safeUser } = user
    return { success: true, user: safeUser as User }
  } catch (error) {
    console.error('Create user error:', error)
    return { success: false, error: 'Failed to create user' }
  }
}

// Authenticate user login
export async function authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
  try {
    const user = await getUserByEmail(email)
    if (!user) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' }
    }

    // Update last login
    await updateUser(user.id, { last_login: new Date().toISOString() })

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: user.id, 
        email: user.email, 
        subscription_tier: user.subscription_tier 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Remove sensitive data
    const { password_hash, verification_token, reset_token, ...safeUser } = user
    return { success: true, user: safeUser as User, token }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

// Verify JWT token
export async function verifyToken(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await getUserById(decoded.user_id)
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const { password_hash, verification_token, reset_token, ...safeUser } = user
    return { success: true, user: safeUser as User }
  } catch (error) {
    return { success: false, error: 'Invalid token' }
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    if (!existsSync(USERS_FILE)) {
      return null
    }

    const content = readFileSync(USERS_FILE, 'utf-8')
    const users = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))

    return users.find(user => user.email === email.toLowerCase().trim()) || null
  } catch (error) {
    console.error('Get user by email error:', error)
    return null
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    if (!existsSync(USERS_FILE)) {
      return null
    }

    const content = readFileSync(USERS_FILE, 'utf-8')
    const users = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))

    return users.find(user => user.id === id) || null
  } catch (error) {
    console.error('Get user by ID error:', error)
    return null
  }
}

// Update user
export async function updateUser(id: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
  try {
    if (!existsSync(USERS_FILE)) {
      return { success: false, error: 'Users file not found' }
    }

    const content = readFileSync(USERS_FILE, 'utf-8')
    const users = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))

    const userIndex = users.findIndex(user => user.id === id)
    if (userIndex === -1) {
      return { success: false, error: 'User not found' }
    }

    // Update user
    users[userIndex] = { ...users[userIndex], ...updates }

    // Write back to file
    const newContent = users.map(user => JSON.stringify(user)).join('\n') + '\n'
    writeFileSync(USERS_FILE, newContent)

    return { success: true }
  } catch (error) {
    console.error('Update user error:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

// Generate API key
function generateApiKey(): string {
  return `btc_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

// Check subscription tier permissions
export function hasPermission(userTier: string, requiredTier: string): boolean {
  const tierHierarchy = ['free', 'basic', 'pro', 'enterprise']
  const userLevel = tierHierarchy.indexOf(userTier)
  const requiredLevel = tierHierarchy.indexOf(requiredTier)
  return userLevel >= requiredLevel
}

// Get all users (admin only)
export async function getAllUsers(): Promise<User[]> {
  try {
    if (!existsSync(USERS_FILE)) {
      return []
    }

    const content = readFileSync(USERS_FILE, 'utf-8')
    const users = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line))

    // Remove sensitive data
    return users.map(({ password_hash, verification_token, reset_token, ...user }) => user)
  } catch (error) {
    console.error('Get all users error:', error)
    return []
  }
}

// User statistics
export async function getUserStats(): Promise<{
  total: number
  byTier: Record<string, number>
  newThisWeek: number
  activeThisWeek: number
}> {
  try {
    const users = await getAllUsers()
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const byTier = users.reduce((acc: Record<string, number>, user) => {
      acc[user.subscription_tier] = (acc[user.subscription_tier] || 0) + 1
      return acc
    }, {})

    const newThisWeek = users.filter(user => 
      new Date(user.created_at) > oneWeekAgo
    ).length

    const activeThisWeek = users.filter(user => 
      user.last_login && new Date(user.last_login) > oneWeekAgo
    ).length

    return {
      total: users.length,
      byTier,
      newThisWeek,
      activeThisWeek
    }
  } catch (error) {
    console.error('Get user stats error:', error)
    return { total: 0, byTier: {}, newThisWeek: 0, activeThisWeek: 0 }
  }
}