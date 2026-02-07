import { Link } from 'react-router-dom'
import { DollarSign, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthContext } from '@/components/AuthProvider'
import { WalletBadge } from '@/components/WalletBadge'

export function Navbar() {
  const { user, profile, signInWithGitHub, signOut } = useAuthContext()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <DollarSign className="h-5 w-5" />
            GitMarket
          </Link>
          <nav className="hidden items-center gap-4 text-sm md:flex">
            <Link to="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
              Browse Bounties
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && profile ? (
            <>
              <WalletBadge balance={profile.balance} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || ''} alt={profile.username || ''} />
                      <AvatarFallback>{profile.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile.username}</p>
                    <p className="text-xs text-muted-foreground">@{profile.github_username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={signInWithGitHub} size="sm">
              Sign in with GitHub
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
