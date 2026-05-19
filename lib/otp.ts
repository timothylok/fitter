import bcrypt from 'bcryptjs'
import { randomInt } from 'node:crypto'

// Range [100000, 1000000) guarantees exactly 6 digits with no leading zeros.
export function generateOtp(): string {
  return randomInt(100000, 1000000).toString()
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10)
}

export async function verifyOtpHash(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash)
}
