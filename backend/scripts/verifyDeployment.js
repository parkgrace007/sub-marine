/**
 * Deployment Verification Script
 *
 * Checks if all required environment variables are set for successful deployment.
 * Run this before deploying to catch configuration issues early.
 *
 * Usage:
 *   node backend/scripts/verifyDeployment.js [environment]
 *
 * Examples:
 *   node backend/scripts/verifyDeployment.js          # Check current environment
 *   node backend/scripts/verifyDeployment.js backend  # Check backend variables
 *   node backend/scripts/verifyDeployment.js frontend # Check frontend variables
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get script directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') })

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
}

// Helper functions for colored output
const c = {
  red: (text) => `${colors.red}${text}${colors.reset}`,
  green: (text) => `${colors.green}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  cyan: (text) => `${colors.cyan}${text}${colors.reset}`,
  gray: (text) => `${colors.gray}${text}${colors.reset}`,
  white: (text) => `${colors.white}${text}${colors.reset}`,
  bold: (text) => `${colors.bold}${text}${colors.reset}`
}

// Required environment variables by service
const REQUIRED_VARS = {
  backend: {
    SUPABASE_URL: {
      required: true,
      description: 'Supabase project URL',
      example: 'https://xxxxx.supabase.co',
      validation: (val) => val?.startsWith('https://') && val.includes('supabase.co')
    },
    SUPABASE_SERVICE_KEY: {
      required: true,
      description: 'Supabase service role key (long JWT token)',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      validation: (val) => val?.startsWith('eyJ') && val.length > 100
    },
    WHALE_ALERT_API_KEY: {
      required: true,
      description: 'Whale Alert API key',
      example: 'your-whale-alert-api-key',
      validation: (val) => val && val.length > 10
    },
    NODE_ENV: {
      required: false,
      description: 'Node environment (development/production)',
      example: 'production',
      validation: (val) => !val || ['development', 'production', 'test'].includes(val)
    },
    PORT: {
      required: false,
      description: 'Server port (default: 3000)',
      example: '3000',
      validation: (val) => !val || (!isNaN(val) && parseInt(val) > 0)
    },
    ADMIN_TOKEN: {
      required: true,
      description: 'Admin authentication token',
      example: 'your-secure-admin-token',
      validation: (val) => val && val.length >= 32
    },
    ALLOWED_ORIGINS: {
      required: false,
      description: 'Comma-separated list of allowed CORS origins (optional, has defaults)',
      example: 'https://your-frontend.onrender.com,https://yourdomain.com',
      validation: (val) => !val || val.includes('http')
    }
  },
  frontend: {
    VITE_SUPABASE_URL: {
      required: true,
      description: 'Supabase project URL (same as backend)',
      example: 'https://xxxxx.supabase.co',
      validation: (val) => val?.startsWith('https://') && val.includes('supabase.co')
    },
    VITE_SUPABASE_ANON_KEY: {
      required: true,
      description: 'Supabase anon/public key (NOT service role key)',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      validation: (val) => val?.startsWith('eyJ') && val.length > 100
    },
    VITE_API_URL: {
      required: true,
      description: 'Backend API URL',
      example: 'https://your-backend.onrender.com',
      validation: (val) => val?.startsWith('http')
    },
    VITE_DEV_MODE: {
      required: false,
      description: 'Development mode flag (true/false)',
      example: 'false',
      validation: (val) => !val || ['true', 'false'].includes(val)
    }
  }
}

/**
 * Check a single environment variable
 */
function checkVariable(name, config, value) {
  const result = {
    name,
    required: config.required,
    present: !!value,
    valid: false,
    message: '',
    level: 'info'
  }

  if (!value) {
    if (config.required) {
      result.level = 'error'
      result.message = `❌ MISSING (required)`
    } else {
      result.level = 'warning'
      result.message = `⚠️  Not set (optional)`
    }
    return result
  }

  // Validate value
  if (config.validation) {
    result.valid = config.validation(value)
    if (!result.valid) {
      result.level = 'error'
      result.message = `❌ INVALID format`
    } else {
      result.level = 'success'
      // Show truncated value for security
      const displayValue = value.length > 30
        ? value.substring(0, 30) + '...'
        : value
      result.message = `✅ ${displayValue}`
    }
  } else {
    result.valid = true
    result.level = 'success'
    result.message = `✅ Set`
  }

  return result
}

/**
 * Verify environment variables for a service
 */
function verifyService(serviceName) {
  const variables = REQUIRED_VARS[serviceName]
  if (!variables) {
    console.log(c.red(`❌ Unknown service: ${serviceName}`))
    console.log(c.gray(`Available services: ${Object.keys(REQUIRED_VARS).join(', ')}`))
    return false
  }

  console.log(c.bold(c.cyan(`\n📋 Checking ${serviceName.toUpperCase()} environment variables...\n`)))

  const results = []
  let hasErrors = false
  let hasWarnings = false

  for (const [name, config] of Object.entries(variables)) {
    const value = process.env[name]
    const result = checkVariable(name, config, value)
    results.push(result)

    if (result.level === 'error') hasErrors = true
    if (result.level === 'warning') hasWarnings = true

    // Print result with color
    const colorMap = {
      success: c.green,
      warning: c.yellow,
      error: c.red,
      info: c.gray
    }
    const color = colorMap[result.level] || c.white

    console.log(color(`${result.message.padEnd(50)} ${name}`))
    console.log(c.gray(`   ${config.description}`))
    if (!result.present || !result.valid) {
      console.log(c.gray(`   Example: ${config.example}`))
    }
    console.log() // Empty line
  }

  // Summary
  console.log(c.bold('\n📊 Summary:'))
  const totalVars = results.length
  const presentVars = results.filter(r => r.present).length
  const validVars = results.filter(r => r.valid).length
  const requiredVars = results.filter(r => r.required).length
  const requiredPresentVars = results.filter(r => r.required && r.present && r.valid).length

  console.log(c.gray(`   Total variables: ${totalVars}`))
  console.log(c.gray(`   Present: ${presentVars}/${totalVars}`))
  console.log(c.gray(`   Valid: ${validVars}/${presentVars}`))
  console.log(c.gray(`   Required (present & valid): ${requiredPresentVars}/${requiredVars}`))

  if (hasErrors) {
    console.log(c.bold(c.red('\n❌ DEPLOYMENT NOT READY - Fix errors above')))
    return false
  }

  if (hasWarnings) {
    console.log(c.bold(c.yellow('\n⚠️  DEPLOYMENT READY - Optional variables missing')))
    return true
  }

  console.log(c.bold(c.green('\n✅ DEPLOYMENT READY - All checks passed')))
  return true
}

/**
 * Print Render deployment guide
 */
function printRenderGuide(serviceName) {
  console.log(c.bold(c.cyan('\n📚 Render Deployment Guide:')))
  console.log(c.gray('\nTo set environment variables in Render:'))
  console.log(c.white('1. Go to your Render Dashboard'))
  console.log(c.white(`2. Select your ${serviceName} service`))
  console.log(c.white('3. Go to "Environment" tab'))
  console.log(c.white('4. Click "Add Environment Variable"'))
  console.log(c.white('5. Add each variable listed above'))
  console.log(c.white('6. Click "Manual Deploy" → "Clear build cache & deploy"'))

  if (serviceName === 'frontend') {
    console.log(c.bold(c.yellow('\n⚠️  IMPORTANT for Frontend (Vite):')))
    console.log(c.yellow('   • Environment variables are embedded at BUILD TIME'))
    console.log(c.yellow('   • After changing env vars, you MUST redeploy'))
    console.log(c.yellow('   • Use "Clear build cache & deploy" to ensure fresh build'))
  }

  if (serviceName === 'backend') {
    console.log(c.bold(c.yellow('\n⚠️  IMPORTANT for Backend:')))
    console.log(c.yellow('   • Use SUPABASE_SERVICE_KEY (NOT anon key)'))
    console.log(c.yellow('   • ADMIN_TOKEN should be at least 32 characters'))
    console.log(c.yellow('   • Backend can pick up env vars at runtime (no rebuild needed)'))
  }

  console.log(c.gray('\n📖 For more details, see DEPLOYMENT.md'))
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)
  const serviceName = args[0] || 'backend'

  console.log(c.bold(c.blue('\n🚀 SubMarine Deployment Verification\n')))
  console.log(c.gray(`Checking environment: ${process.env.NODE_ENV || 'development'}`))
  console.log(c.gray(`Service: ${serviceName}`))

  const isReady = verifyService(serviceName)

  if (!isReady) {
    printRenderGuide(serviceName)
    process.exit(1)
  }

  printRenderGuide(serviceName)
  process.exit(0)
}

main()
