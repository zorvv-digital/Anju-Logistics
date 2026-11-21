import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Field } from "@/components/common/Field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Role } from "@/lib/types"
import { useStore } from "@/store/useStore"

// ponytail: demo-only logins in the browser. Real auth comes with the backend.
const USERS: Record<string, { pin: string; role: Role; name: string }> = {
  owner: { pin: "1111", role: "owner", name: "Owner" },
  accounts: { pin: "2222", role: "accountant", name: "Accountant" },
}

export function LoginPage() {
  const role = useStore((s) => s.role)
  const login = useStore((s) => s.login)
  const navigate = useNavigate()
  const [user, setUser] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)

  if (role) return <Navigate to="/" replace />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const u = USERS[user.trim().toLowerCase()]
    if (!user.trim() || !pin) return setError("Enter username and PIN")
    if (!u || u.pin !== pin) return setError("Wrong username or PIN")
    login(u.role, u.name)
    navigate("/")
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Anju Logistics</CardTitle>
          <CardDescription>Sign in to manage bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field label="Username" htmlFor="user">
              <Input id="user" autoComplete="username" value={user} onChange={(e) => { setUser(e.target.value); setError(null) }} />
            </Field>
            <Field label="PIN" htmlFor="pin">
              <Input id="pin" type="password" inputMode="numeric" autoComplete="current-password" value={pin} onChange={(e) => { setPin(e.target.value); setError(null) }} />
            </Field>
            <Button type="submit">Sign in</Button>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(USERS).map(([key, u]) => (
                <Button key={key} type="button" variant="outline" size="sm" onClick={() => { setUser(key); setPin(u.pin); setError(null) }}>
                  Demo: {u.name}
                </Button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
